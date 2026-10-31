import { MLServiceClient } from './ml.service.js';
import { MLInputBuilder } from '../utils/ml-input-builder.js';
import { calculateRotationFactor, cropMetadata } from '../utils/crop-rotation-rules.js';
import { MarketService } from './market.service.js';
import { reverseGeocode } from '../utils/reverse-geocode.js';
import CropHistory from '../models/cropHistory.model.js';
import Farm from '../models/farm.model.js';

export class RecommendationService {
    static async getCropPrediction({
        nitrogen,
        phosphorus,
        potassium,
        temperature,
        humidity,
        pH,
        rainfall,
        farmId,
        userId,
        state: manualState,
        district: manualDistrict
    }) {
        let previousCrop = null;
        let previousCropYear = null;
        let historyUsed = false;
        let rotationNote = null;

        let state = null;
        let district = null;
        let locationSource = 'none';

        if (farmId && userId) {
            const farm = await Farm.findOne({ _id: farmId, userId });

            if (farm) {
                const latestHistory = await CropHistory.findOne({ farmId, userId })
                    .sort({ year: -1, createdAt: -1 });

                if (latestHistory && latestHistory.crop) {
                    previousCrop = latestHistory.crop.toLowerCase().trim();
                    previousCropYear = latestHistory.year;
                    historyUsed = true;
                }

                if (farm.latitude && farm.longitude) {
                    const geo = await reverseGeocode(farm.latitude, farm.longitude);
                    if (geo && geo.state) {
                        state = geo.state;
                        district = geo.district || null;
                        locationSource = 'auto';
                    }
                }
            }
        }

        // Fall back to manual state/district if farm reverse-geocoding did not resolve a state
        if (!state && manualState && typeof manualState === 'string' && manualState.trim()) {
            state = manualState.trim();
            district = (manualDistrict && typeof manualDistrict === 'string' && manualDistrict.trim())
                ? manualDistrict.trim()
                : null;
            locationSource = 'manual';
        }

        const farmData = { nitrogen, phosphorus, potassium, pH };
        const weatherData = { temperature, humidity };
        const rainfallData = { rainfall };
        const canonicalFeatures = MLInputBuilder.build(farmData, weatherData, rainfallData);

        const mlResponse = await MLServiceClient.predictCrop(canonicalFeatures);
        let allCandidates = mlResponse.data.recommendations || [];

        const marketData = await MarketService.getMarketPricesForRecommendation({ state, district });
        const { prices: candidateMarketPrices, locationLevel: marketLocationLevel } = marketData;
        const marketUsed = Object.keys(candidateMarketPrices).length > 0;

        const availablePrices = [];
        for (const cand of allCandidates) {
            if (candidateMarketPrices[cand.crop]) {
                availablePrices.push(candidateMarketPrices[cand.crop].price);
            }
        }

        availablePrices.sort((a, b) => a - b);
        const validPriceCount = availablePrices.length;

        const newRecommendations = [];

        // Apply business scoring to the complete available candidate pool first
        for (const cand of allCandidates) {
            const mlProbability = cand.probability !== undefined ? cand.probability : cand.score;
            const candidateCrop = cand.crop;

            const rotationFactor = calculateRotationFactor(previousCrop, candidateCrop);

            let marketFactor = 1.0;
            let marketPriceInfo = null;
            let marketDate = null;
            let marketTrend = "unavailable";
            let marketDemandSignal = "Unavailable";

            if (marketUsed && candidateMarketPrices[candidateCrop]) {
                const cropPriceInfo = candidateMarketPrices[candidateCrop];
                marketPriceInfo = cropPriceInfo.price;
                marketDate = cropPriceInfo.date;

                if (cropPriceInfo.intelligence) {
                    marketTrend = cropPriceInfo.intelligence.priceTrend.direction;
                    marketDemandSignal = cropPriceInfo.intelligence.demandSignal.signal;
                }

                // Tie-aware average-rank percentile calculation for modal prices
                if (validPriceCount >= 2) {
                    const firstIndex = availablePrices.indexOf(marketPriceInfo);
                    const lastIndex = availablePrices.lastIndexOf(marketPriceInfo);
                    if (firstIndex !== -1) {
                        const avgRank = (firstIndex + lastIndex) / 2;
                        const marketPercentile = avgRank / (validPriceCount - 1);
                        marketFactor = 0.95 + (marketPercentile * 0.10);

                        if (marketDemandSignal === 'High') marketFactor += 0.01;
                        if (marketDemandSignal === 'Low') marketFactor -= 0.01;

                        marketFactor = Math.max(0.95, Math.min(1.05, marketFactor));
                    }
                }
            }

            const rawFinalScore = mlProbability * rotationFactor * marketFactor;

            newRecommendations.push({
                crop: candidateCrop,
                mlProbability: mlProbability,
                rotationFactor: rotationFactor,
                marketFactor: marketFactor,
                rawFinalScore: rawFinalScore,
                marketPrice: marketPriceInfo,
                marketPriceUnit: marketPriceInfo ? "quintal" : null,
                marketDataDate: marketDate,
                marketTrend: marketTrend,
                demandSignal: marketDemandSignal
            });
        }

        // Deterministic multi-tier ranking on full-precision values:
        // 1. Higher final score first (full-precision)
        // 2. Higher ML probability first (full-precision)
        // 3. Alphabetical crop name as final tie-breaker
        newRecommendations.sort((a, b) => {
            const scoreDiff = b.rawFinalScore - a.rawFinalScore;
            if (Math.abs(scoreDiff) > 1e-9) {
                return scoreDiff;
            }
            const mlDiff = b.mlProbability - a.mlProbability;
            if (Math.abs(mlDiff) > 1e-9) {
                return mlDiff;
            }
            return a.crop.localeCompare(b.crop);
        });

        // Select the final top 5 recommendations (or fewer if candidate pool is smaller)
        const top5 = newRecommendations.slice(0, 5).map((r, index) => ({
            crop: r.crop,
            mlProbability: Number(r.mlProbability.toFixed(4)),
            rotationFactor: r.rotationFactor,
            marketFactor: Number(r.marketFactor.toFixed(4)),
            finalScore: Number(r.rawFinalScore.toFixed(4)),
            marketPrice: r.marketPrice,
            marketPriceUnit: r.marketPriceUnit,
            marketDataDate: r.marketDataDate,
            marketTrend: r.marketTrend,
            demandSignal: r.demandSignal,
            rank: index + 1
        }));

        if (historyUsed) {
            rotationNote = "Previous crop information was considered as an additional crop-rotation factor.";
            const prevMeta = cropMetadata[previousCrop];
            if (prevMeta && prevMeta.legume) {
                rotationNote = "Your previous crop was a legume. It was considered in context without arbitrarily overriding the environmental ML analysis.";
            }
            if (top5.length > 0 && top5[0].rotationFactor < 1.0) {
                rotationNote = `Your previous crop was the same annual crop (${top5[0].crop}), so its ranking received a moderate rotation penalty, but its environmental ML score remained high.`;
            }
        }

        let marketNote = "Market information was unavailable, so market price was not used in this recommendation.";
        if (marketUsed) {
            marketNote = "Recent market prices were considered as a secondary ranking factor.";
        } else if (validPriceCount === 1) {
            marketNote = "Only one compatible market price was found, meaning relative mathematical balancing could not securely occur; market factor defaulted neutrally to 1.0.";
        }

        return {
            historyUsed,
            previousCrop,
            previousCropYear,
            marketUsed,
            marketLocationLevel,
            locationSource,
            recommendations: top5,
            rotationNote,
            marketNote
        };
    }
}
