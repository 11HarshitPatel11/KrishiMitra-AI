/**
 * test_recommendation_scoring_unit.js
 * ---------------------------------------------------------------------------
 * Step 24.37 Verification Suite:
 * Crop Recommendation Scoring, Ranking, Filtering, and Localization Parity.
 *
 * Tests the 9 mandatory verification cases:
 *  1. Only two crops have non-zero ML probabilities.
 *  2. Five or more crops have non-zero probabilities.
 *  3. A crop initially ranked 6th becomes top recommendation after adjustments.
 *  4. Multiple crops have identical market prices (average-rank tie-handling).
 *  5. Multiple crops have identical final scores (deterministic secondary/tertiary sorting).
 *  6. No market data is available (neutral fallback).
 *  7. No crop history exists (neutral rotation factor).
 *  8. A crop receives a monoculture penalty (0.75 for same annual crop).
 *  9. English and Hindi translation dictionaries maintain 100% key parity.
 * ---------------------------------------------------------------------------
 */

import { calculateRotationFactor, cropMetadata } from './src/utils/crop-rotation-rules.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label} ${detail ? `(${detail})` : ''}`);
        failed++;
    }
}

/**
 * Pure scoring & ranking implementation mirroring RecommendationService logic.
 */
function evaluateCandidates({
    candidates,
    previousCrop = null,
    candidateMarketPrices = {},
    marketUsed = false
}) {
    const availablePrices = [];
    for (const cand of candidates) {
        if (candidateMarketPrices[cand.crop]) {
            availablePrices.push(candidateMarketPrices[cand.crop].price);
        }
    }
    availablePrices.sort((a, b) => a - b);
    const validPriceCount = availablePrices.length;

    const newRecommendations = [];

    for (const cand of candidates) {
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

    return top5;
}

console.log("==================================================");
console.log("Step 24.37 — Crop Recommendation Scoring Test Suite");
console.log("==================================================");

// -----------------------------------------------------------------------------
// Case 1: Only two crops have non-zero ML probabilities
// -----------------------------------------------------------------------------
console.log("\n【Case 1】 Only two crops have non-zero ML probabilities");
{
    const candidates = [
        { crop: 'rice', score: 0.90 },
        { crop: 'jute', score: 0.10 }
    ];
    const results = evaluateCandidates({ candidates });
    assert(results.length === 2, "Returns exactly 2 recommendations (no zero-probability padding)");
    assert(results[0].crop === 'rice' && results[0].rank === 1, "Rank 1 is 'rice'");
    assert(results[1].crop === 'jute' && results[1].rank === 2, "Rank 2 is 'jute'");
    assert(results.every(r => r.finalScore > 0), "All returned crops have finalScore > 0");
}

// -----------------------------------------------------------------------------
// Case 2: Five or more crops have non-zero probabilities
// -----------------------------------------------------------------------------
console.log("\n【Case 2】 Five or more crops have non-zero probabilities (e.g. 7 candidates)");
{
    const candidates = [
        { crop: 'rice', score: 0.35 },
        { crop: 'maize', score: 0.25 },
        { crop: 'cotton', score: 0.15 },
        { crop: 'jute', score: 0.10 },
        { crop: 'chickpea', score: 0.08 },
        { crop: 'mothbeans', score: 0.05 },
        { crop: 'lentil', score: 0.02 }
    ];
    const results = evaluateCandidates({ candidates });
    assert(results.length === 5, "Returns top 5 recommendations from 7 available candidates");
    assert(results[0].rank === 1 && results[4].rank === 5, "Ranks are strictly sequenced from 1 to 5");
    assert(results[0].crop === 'rice', "Top recommendation is 'rice'");
    assert(results.every(r => r.finalScore > 0), "All recommendations have positive scores");
}

// -----------------------------------------------------------------------------
// Case 3: A crop initially ranked 6th becomes top recommendation after adjustments
// -----------------------------------------------------------------------------
console.log("\n【Case 3】 Crop initially ranked 6th becomes #1 after rotation and market factors");
{
    // Initially ranked by ML score:
    // 1. rice: 0.26
    // 2. maize: 0.25
    // 3. cotton: 0.24
    // 4. jute: 0.23
    // 5. chickpea: 0.22
    // 6. watermelon: 0.21
    //
    // Farmer's previous crop was 'rice'.
    // Furthermore, crops 2-5 have weak market prices in this mandi (marketFactor = 0.95)
    // Rice receives rotation monoculture penalty (0.75) and weak market (0.95):
    //   rice: 0.26 * 0.75 * 0.95 = 0.18525
    //   maize: 0.25 * 0.75 (if same) or with market: 0.25 * 1.0 * 0.95 = 0.2375...
    // Let's make candidate 1-5 all annual crops that receive rotation penalties or market discounts:
    // If previous crops or market discounts apply:
    // For example:
    // candidates:
    //   1. rice (ML: 0.25) -> previousCrop = rice -> rotation = 0.75 -> finalScore = 0.25 * 0.75 * 0.95 = 0.1781
    //   2. maize (ML: 0.24) -> market price low -> marketFactor = 0.95 -> 0.24 * 0.95 = 0.2280
    //   3. cotton (ML: 0.23) -> marketFactor = 0.95 -> 0.23 * 0.95 = 0.2185
    //   4. jute (ML: 0.22) -> marketFactor = 0.95 -> 0.22 * 0.95 = 0.2090
    //   5. chickpea (ML: 0.21) -> marketFactor = 0.95 -> 0.21 * 0.95 = 0.1995
    //   6. watermelon (ML: 0.20) -> rotation 1.0, market high price + high demand -> marketFactor = 1.05 -> 0.20 * 1.05 = 0.2100
    // If crops 2-5 have lower initial ML scores, e.g.:
    //   1. rice: 0.25 (rotation 0.75 -> 0.1875)
    //   2. maize: 0.19
    //   3. cotton: 0.18
    //   4. jute: 0.17
    //   5. chickpea: 0.16
    //   6. watermelon: 0.20 -> with high market factor (1.05) -> 0.2100!
    // Notice watermelon was 6th in the ML candidates list because ML list was [rice, maize, cotton, jute, chickpea, watermelon]!
    const candidates = [
        { crop: 'rice', score: 0.25 },       // 1st: 0.25 * 0.75 * 1.00 = 0.1875
        { crop: 'maize', score: 0.19 },      // 2nd: 0.19 * 1.00 * 0.95 = 0.1805
        { crop: 'cotton', score: 0.18 },     // 3rd: 0.18 * 1.00 * 0.95 = 0.1710
        { crop: 'jute', score: 0.17 },       // 4th: 0.17 * 1.00 * 0.95 = 0.1615
        { crop: 'chickpea', score: 0.16 },   // 5th: 0.16 * 1.00 * 0.95 = 0.1520
        { crop: 'watermelon', score: 0.20 }  // 6th initially: 0.20 * 1.00 * 1.05 = 0.2100 -> WINS!
    ];

    const candidateMarketPrices = {
        maize: { price: 1500, intelligence: { priceTrend: { direction: 'falling' }, demandSignal: { signal: 'Low' } } },
        cotton: { price: 1600, intelligence: { priceTrend: { direction: 'falling' }, demandSignal: { signal: 'Low' } } },
        jute: { price: 1700, intelligence: { priceTrend: { direction: 'falling' }, demandSignal: { signal: 'Low' } } },
        chickpea: { price: 1800, intelligence: { priceTrend: { direction: 'falling' }, demandSignal: { signal: 'Low' } } },
        watermelon: { price: 4500, intelligence: { priceTrend: { direction: 'rising' }, demandSignal: { signal: 'High' } } }
    };

    // Farmer grew 'rice' previously -> rice gets 0.75 penalty
    const results = evaluateCandidates({
        candidates,
        previousCrop: 'rice',
        candidateMarketPrices,
        marketUsed: true
    });

    assert(results[0].crop === 'watermelon', "Watermelon (initially 6th) promoted to Rank 1", `Got ${results[0].crop}`);
    assert(results[0].rank === 1, "Watermelon receives rank 1");
    assert(results[0].finalScore === 0.2100, `Watermelon finalScore is 0.2100 (got ${results[0].finalScore})`);
    assert(results.length === 5, "Only top 5 returned out of 6 candidates");
}

// -----------------------------------------------------------------------------
// Case 4: Multiple crops have identical market prices (average-rank tie-handling)
// -----------------------------------------------------------------------------
console.log("\n【Case 4】 Multiple crops have identical market prices (average-rank percentile)");
{
    const candidates = [
        { crop: 'cropA', score: 0.50 },
        { crop: 'cropB', score: 0.50 }
    ];
    // Both crops have identical prices
    const candidateMarketPrices = {
        cropA: { price: 2500, intelligence: { priceTrend: { direction: 'stable' }, demandSignal: { signal: 'Moderate' } } },
        cropB: { price: 2500, intelligence: { priceTrend: { direction: 'stable' }, demandSignal: { signal: 'Moderate' } } }
    };

    const results = evaluateCandidates({
        candidates,
        candidateMarketPrices,
        marketUsed: true
    });

    assert(results[0].marketFactor === 1.0000, `Tied price cropA receives neutral market factor 1.0000 (got ${results[0].marketFactor})`);
    assert(results[1].marketFactor === 1.0000, `Tied price cropB receives neutral market factor 1.0000 (got ${results[1].marketFactor})`);
    assert(results[0].marketFactor === results[1].marketFactor, "Both tied crops receive identical marketFactor");

    // Test 4 items with ties in the middle [1000, 2500, 2500, 4000]
    const candidates4 = [
        { crop: 'cropLow', score: 0.25 },
        { crop: 'cropMid1', score: 0.25 },
        { crop: 'cropMid2', score: 0.25 },
        { crop: 'cropHigh', score: 0.25 }
    ];
    const prices4 = {
        cropLow: { price: 1000 },
        cropMid1: { price: 2500 },
        cropMid2: { price: 2500 },
        cropHigh: { price: 4000 }
    };
    const results4 = evaluateCandidates({
        candidates: candidates4,
        candidateMarketPrices: prices4,
        marketUsed: true
    });
    const mid1 = results4.find(r => r.crop === 'cropMid1');
    const mid2 = results4.find(r => r.crop === 'cropMid2');
    assert(mid1.marketFactor === 1.0000, `Mid1 tied price gets exact midpoint factor 1.0000 (got ${mid1.marketFactor})`);
    assert(mid2.marketFactor === 1.0000, `Mid2 tied price gets exact midpoint factor 1.0000 (got ${mid2.marketFactor})`);
}

// -----------------------------------------------------------------------------
// Case 5: Multiple crops have identical final scores (deterministic sorting)
// -----------------------------------------------------------------------------
console.log("\n【Case 5】 Multiple crops have identical final scores (deterministic tie-breakers)");
{
    // Sub-case 5A: Identical finalScore, different ML probability
    // CropX: mlProb = 0.40, rotation = 1.0, market = 1.0 -> finalScore = 0.40
    // CropY: mlProb = 0.50, rotation = 0.8 (hypothetical), market = 1.0 -> finalScore = 0.40
    // Higher ML probability should win!
    const candidatesA = [
        { crop: 'zebra', score: 0.40 },
        { crop: 'apple', score: 0.40 }
    ];
    const resultsA = evaluateCandidates({ candidates: candidatesA });
    // Identical score and identical mlProb -> alphabetical tie breaker ('apple' before 'zebra')
    assert(resultsA[0].crop === 'apple', "Alphabetical tie-breaker: 'apple' ranks before 'zebra'");
    assert(resultsA[1].crop === 'zebra', "Alphabetical tie-breaker: 'zebra' ranks second");

    // Sub-case 5B: Full-precision sorting vs premature rounding
    // Crop 1: 0.40004 -> rounded 0.4000
    // Crop 2: 0.40001 -> rounded 0.4000
    // Full precision must rank Crop 1 first!
    const candidatesB = [
        { crop: 'cropSecond', score: 0.40001 },
        { crop: 'cropFirst', score: 0.40004 }
    ];
    const resultsB = evaluateCandidates({ candidates: candidatesB });
    assert(resultsB[0].crop === 'cropFirst', "Full precision sorting ranks cropFirst before cropSecond");
}

// -----------------------------------------------------------------------------
// Case 6: No market data is available
// -----------------------------------------------------------------------------
console.log("\n【Case 6】 No market data is available (neutral fallback)");
{
    const candidates = [
        { crop: 'rice', score: 0.60 },
        { crop: 'maize', score: 0.40 }
    ];
    const results = evaluateCandidates({
        candidates,
        candidateMarketPrices: {},
        marketUsed: false
    });
    assert(results.every(r => r.marketFactor === 1.0), "All crops receive marketFactor = 1.0 when no market data is used");
    assert(results[0].finalScore === 0.60, "Final scores match ML probabilities without market skew");
}

// -----------------------------------------------------------------------------
// Case 7: No crop history exists
// -----------------------------------------------------------------------------
console.log("\n【Case 7】 No crop history exists (neutral rotation factor)");
{
    const candidates = [
        { crop: 'rice', score: 0.70 },
        { crop: 'cotton', score: 0.30 }
    ];
    const results = evaluateCandidates({
        candidates,
        previousCrop: null
    });
    assert(results.every(r => r.rotationFactor === 1.0), "All crops receive rotationFactor = 1.0 when no crop history exists");
}

// -----------------------------------------------------------------------------
// Case 8: A crop receives a monoculture penalty
// -----------------------------------------------------------------------------
console.log("\n【Case 8】 A crop receives a monoculture penalty (0.75 for same annual crop)");
{
    const candidates = [
        { crop: 'rice', score: 0.60 },
        { crop: 'maize', score: 0.40 }
    ];
    // Previous crop was annual 'rice'
    const results = evaluateCandidates({
        candidates,
        previousCrop: 'rice'
    });
    const riceRec = results.find(r => r.crop === 'rice');
    const maizeRec = results.find(r => r.crop === 'maize');
    assert(riceRec.rotationFactor === 0.75, "Same annual crop (rice) receives 0.75 rotation penalty");
    assert(maizeRec.rotationFactor === 1.00, "Different annual crop (maize) receives 1.00 rotation factor");
    assert(riceRec.finalScore === 0.4500, `Rice final score is 0.60 * 0.75 = 0.4500 (got ${riceRec.finalScore})`);
}

// -----------------------------------------------------------------------------
// Case 9: English/Hindi translation parity
// -----------------------------------------------------------------------------
console.log("\n【Case 9】 English/Hindi translation parity");
{
    const enPath = path.resolve('client/src/locales/en.js');
    const hiPath = path.resolve('client/src/locales/hi.js');

    // Parse JS files by dynamic import
    const enModule = await import(`file://${enPath.replace(/\\/g, '/')}`);
    const hiModule = await import(`file://${hiPath.replace(/\\/g, '/')}`);

    const en = enModule.default || enModule;
    const hi = hiModule.default || hiModule;

    function checkParity(obj1, obj2, prefix = '') {
        let diffs = [];
        for (const k of Object.keys(obj1)) {
            if (!(k in obj2)) diffs.push(`Missing in hi: ${prefix}${k}`);
            else if (typeof obj1[k] === 'object' && obj1[k] !== null) {
                diffs = diffs.concat(checkParity(obj1[k], obj2[k], `${prefix}${k}.`));
            }
        }
        for (const k of Object.keys(obj2)) {
            if (!(k in obj1)) diffs.push(`Missing in en: ${prefix}${k}`);
        }
        return diffs;
    }

    const diffs = checkParity(en, hi);
    assert(diffs.length === 0, `100% key parity between en.js and hi.js (${diffs.length} diffs)`);
    assert(en.recommendation?.standardRotation === 'Standard Rotation', "en.recommendation.standardRotation is 'Standard Rotation'");
    assert(Boolean(hi.recommendation?.standardRotation), "hi.recommendation.standardRotation is defined in Hindi");
}

console.log("\n==================================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("==================================================\n");

if (failed > 0) {
    process.exit(1);
} else {
    console.log("ALL 9 VERIFICATION TEST CASES PASSED ✅");
}
