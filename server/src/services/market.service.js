import { classifyFreshness } from '../utils/market-freshness.js';
import { calculateDemandSignal } from '../utils/marketDemandSignal.js';

// Canonical exact reverse map (backward compatible baseline for verified 22 crops)
const EXACT_REVERSE_COMMODITY_MAP = {
    'paddy(dhan)(common)': 'rice',
    'bengal gram(gram)(whole)': 'chickpea',
    'maize': 'maize',
    'rajgir': 'kidneybeans',
    'arhar (tur/red gram)(whole)': 'pigeonpeas',
    'moth dal': 'mothbeans',
    'green gram (moong)(whole)': 'mungbean',
    'black gram (urd beans)(whole)': 'blackgram',
    'lentil (masur)(whole)': 'lentil',
    'pomegranate': 'pomegranate',
    'banana': 'banana',
    'mango': 'mango',
    'grapes': 'grapes',
    'water melon': 'watermelon',
    'kharbuja': 'muskmelon',
    'apple': 'apple',
    'orange': 'orange',
    'papaya': 'papaya',
    'coconut': 'coconut',
    'cotton': 'cotton',
    'jute': 'jute',
    'coffee': 'coffee'
};

// Normalized alphanumeric lookup table handling case, spacing, punctuation, and Agmarknet aliases
const NORMALIZED_COMMODITY_MAP = {
    // 1. Rice / Paddy
    'paddydhancommon': 'rice',
    'paddydhan': 'rice',
    'paddybasmati': 'rice',
    'paddygradea': 'rice',
    'paddycommon': 'rice',
    'paddy': 'rice',
    'dhan': 'rice',
    'rice': 'rice',

    // 2. Chickpea / Bengal Gram / Chana
    'bengalgramgramwhole': 'chickpea',
    'bengalgramwhole': 'chickpea',
    'bengalgram': 'chickpea',
    'gramwhole': 'chickpea',
    'gramraw': 'chickpea',
    'gram': 'chickpea',
    'chana': 'chickpea',
    'chanawhole': 'chickpea',
    'kabulichana': 'chickpea',
    'gramchana': 'chickpea',
    'chanagram': 'chickpea',
    'chickpea': 'chickpea',
    'chickpeas': 'chickpea',

    // 3. Maize / Corn
    'maize': 'maize',
    'corn': 'maize',
    'makka': 'maize',
    'sweetcorn': 'maize',

    // 4. Kidneybeans / Rajma / Rajgir
    'rajgir': 'kidneybeans',
    'rajma': 'kidneybeans',
    'rajmash': 'kidneybeans',
    'kidneybeans': 'kidneybeans',
    'kidneybean': 'kidneybeans',

    // 5. Pigeonpeas / Arhar / Tur
    'arharturredgramwhole': 'pigeonpeas',
    'arharturredgram': 'pigeonpeas',
    'arhartur': 'pigeonpeas',
    'arhardal': 'pigeonpeas',
    'turdal': 'pigeonpeas',
    'arhar': 'pigeonpeas',
    'tur': 'pigeonpeas',
    'redgram': 'pigeonpeas',
    'tuvar': 'pigeonpeas',
    'toor': 'pigeonpeas',
    'toordal': 'pigeonpeas',
    'pigeonpea': 'pigeonpeas',
    'pigeonpeas': 'pigeonpeas',

    // 6. Mothbeans / Moth Dal / Matki
    'mothdal': 'mothbeans',
    'moth': 'mothbeans',
    'mothbeans': 'mothbeans',
    'mothbean': 'mothbeans',
    'matki': 'mothbeans',

    // 7. Mungbean / Green Gram / Moong
    'greengrammoongwhole': 'mungbean',
    'greengrammoong': 'mungbean',
    'greengram': 'mungbean',
    'moongwhole': 'mungbean',
    'moongdal': 'mungbean',
    'moong': 'mungbean',
    'mung': 'mungbean',
    'munggreengram': 'mungbean',
    'greengrammung': 'mungbean',
    'mungbean': 'mungbean',
    'mungbeans': 'mungbean',

    // 8. Blackgram / Urd / Urad
    'blackgramurdbeanswhole': 'blackgram',
    'blackgramurdbeans': 'blackgram',
    'blackgramurd': 'blackgram',
    'urdblackgram': 'blackgram',
    'blackgram': 'blackgram',
    'blackgrams': 'blackgram',
    'urdbeans': 'blackgram',
    'urad': 'blackgram',
    'urd': 'blackgram',
    'uraddal': 'blackgram',
    'mash': 'blackgram',

    // 9. Lentil / Masur
    'lentilmasurwhole': 'lentil',
    'lentilmasur': 'lentil',
    'lentil': 'lentil',
    'lentils': 'lentil',
    'masurwhole': 'lentil',
    'masurdal': 'lentil',
    'masur': 'lentil',
    'masoor': 'lentil',

    // 10. Pomegranate
    'pomegranate': 'pomegranate',
    'pomegranates': 'pomegranate',
    'anar': 'pomegranate',

    // 11. Banana
    'banana': 'banana',
    'bananas': 'banana',
    'bananagreen': 'banana',
    'kela': 'banana',

    // 12. Mango
    'mango': 'mango',
    'mangoes': 'mango',
    'mangorawripe': 'mango',
    'aam': 'mango',

    // 13. Grapes
    'grapes': 'grapes',
    'grape': 'grapes',
    'angoor': 'grapes',

    // 14. Watermelon
    'watermelon': 'watermelon',
    'watermelons': 'watermelon',
    'tarbooj': 'watermelon',
    'tarbuz': 'watermelon',

    // 15. Muskmelon / Kharbuja
    'kharbuja': 'muskmelon',
    'muskmelon': 'muskmelon',
    'muskmelons': 'muskmelon',
    'cantaloupe': 'muskmelon',

    // 16. Apple
    'apple': 'apple',
    'apples': 'apple',
    'seb': 'apple',

    // 17. Orange
    'orange': 'orange',
    'oranges': 'orange',
    'santra': 'orange',
    'mandarin': 'orange',
    'mosambi': 'orange',
    'sweetorange': 'orange',
    'narangi': 'orange',

    // 18. Papaya
    'papaya': 'papaya',
    'papayas': 'papaya',
    'papayaraw': 'papaya',
    'papita': 'papaya',

    // 19. Coconut
    'coconut': 'coconut',
    'coconuts': 'coconut',
    'nariyal': 'coconut',
    'copra': 'coconut',

    // 20. Cotton
    'cotton': 'cotton',
    'kapas': 'cotton',
    'cottonlint': 'cotton',
    'lintcotton': 'cotton',
    'rawcotton': 'cotton',
    'seedcotton': 'cotton',

    // 21. Jute
    'jute': 'jute',
    'pat': 'jute',
    'rawjute': 'jute',
    'juteraw': 'jute',

    // 22. Coffee
    'coffee': 'coffee',
    'kafi': 'coffee',
    'coffeearabica': 'coffee',
    'coffeerobusta': 'coffee',
    'arabica': 'coffee',
    'robusta': 'coffee'
};

const DEFAULT_MARKET_API_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export class MarketService {
    static async getMarketPrices({ commodity, state, district, limit = 10 }) {
        let rawBaseUrl = process.env.MARKET_API_BASE_URL;
        let baseUrl = (typeof rawBaseUrl === 'string' && rawBaseUrl.trim())
            ? rawBaseUrl.trim()
            : DEFAULT_MARKET_API_BASE_URL;

        baseUrl = baseUrl.replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '');
        if (!baseUrl) {
            baseUrl = DEFAULT_MARKET_API_BASE_URL;
        }

        let url;
        try {
            url = new URL(baseUrl);
        } catch (_) {
            const err = new Error("Market API is not configured.");
            err.code = 'CONFIG_MISSING';
            throw err;
        }

        const requestHost = url.hostname;
        const apiKey = process.env.MARKET_API_KEY;

        if (!apiKey || !apiKey.trim() || apiKey.includes('YOUR_API_KEY')) {
            const err = new Error("Market API Key is missing.");
            err.code = 'CONFIG_MISSING';
            throw err;
        }

        try {
            url.searchParams.append('api-key', apiKey);
            url.searchParams.append('format', 'json');

            // We request more from the API to allow post-filtering and deep historical analysis natively
            url.searchParams.append('limit', Math.min(limit * 5, 200).toString());

            let searchCommodity = commodity;
            if (commodity) {
                searchCommodity = this.mapCropToMarketCommodity(commodity);
                url.searchParams.append('filters[commodity]', searchCommodity);
            }
            if (state) {
                url.searchParams.append('filters[state]', state);
            }
            if (district) {
                url.searchParams.append('filters[district]', district);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let response;
            try {
                response = await fetch(url.toString(), {
                    headers: {
                        'User-Agent': 'KrishiMitra-AI/1.0 (https://github.com/11HarshitPatel11/KrishiMitra-AI)',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                let upstreamReason = '';
                try {
                    const errJson = await response.json();
                    upstreamReason = errJson.error || errJson.reason || errJson.message || JSON.stringify(errJson);
                } catch (_) {}
                console.error(`[MarketService] Upstream host "${requestHost}" returned HTTP ${response.status}${upstreamReason ? `: "${upstreamReason}"` : ''}`);
                throw new Error(`Data.gov.in responded with status ${response.status}`);
            }

            const data = await response.json();

            // Detect if Data.gov.in returned an error status in JSON body
            if (data && (data.status === 'failed' || data.error || (data.message && !data.records))) {
                const err = new Error(data.message || data.error || 'Data.gov.in service error');
                err.code = 'SERVICE_UNAVAILABLE';
                throw err;
            }

            let validRecords = [];
            let latestParsedDate = null;
            let latestDateStr = 'Unknown';

            if (data && data.records && Array.isArray(data.records)) {
                // Normalize and validate
                const rawRecords = data.records.map(r => this.normalizeRecord(r)).filter(r => r !== null);

                const seen = new Set();
                for (const r of rawRecords) {
                    const hash = `${r.commodity}-${r.state}-${r.market}-${r.date}-${r.modalPrice}`;
                    if (!seen.has(hash)) {
                        seen.add(hash);
                        validRecords.push(r);

                        const d = this.parseMandiDate(r.date);
                        if (d && (!latestParsedDate || d > latestParsedDate)) {
                            latestParsedDate = d;
                            latestDateStr = r.date;
                        }
                    }
                }
            }

            // Compile robust market intelligence structure (Trends, Arrivals, Signals)
            // By grouping the raw date outputs logically and returning derived objects per requested array limit
            const intelligenceRecords = this.buildIntelligenceNodes(validRecords, latestParsedDate);

            // Slice to user's exact requested limit (using our new intelligence structural format)
            const slicedRecords = intelligenceRecords.slice(0, limit);
            const freshnessStatus = classifyFreshness(latestDateStr);

            return {
                records: slicedRecords, // these are now Market Intelligence Objects
                metadata: {
                    source: "Government of India OGD",
                    latestDataDate: latestDateStr,
                    freshness: freshnessStatus
                }
            };
        } catch (error) {
            if (error.code === 'CONFIG_MISSING') {
                throw error;
            }
            const causeName = error.cause?.name ? `${error.cause.name}: ` : '';
            const causeMsg = error.cause?.message || (typeof error.cause === 'string' ? error.cause : '');
            const causeCode = error.cause?.code ? ` [${error.cause.code}]` : '';
            const causeDetails = (causeName || causeMsg || causeCode) ? ` (Cause: ${causeName}${causeMsg}${causeCode})` : '';

            console.error(`[MarketService] Market fetch failed for host "${requestHost}": ${error.name || 'Error'} - ${error.message}${causeDetails}`);
            const err = new Error("Market Service Unavailable");
            err.code = 'SERVICE_UNAVAILABLE';
            throw err;
        }
    }

    /**
     * Builds bounded 'Market Intelligence Objects' processing historical records transparently.
     * Prevents faking variables if OGD bounds don't return history traces.
     */
    static buildIntelligenceNodes(rawRecords, latestParsedDate) {
        // 1. Calculate Regional Commodity Statistics across all reporting markets
        const commodityBenchmarks = {};
        for (const r of rawRecords) {
            const c = r.commodity;
            if (!commodityBenchmarks[c]) {
                commodityBenchmarks[c] = { sum: 0, count: 0, prices: [] };
            }
            commodityBenchmarks[c].sum += r.modalPrice;
            commodityBenchmarks[c].count += 1;
            commodityBenchmarks[c].prices.push(r.modalPrice);
        }
        for (const c in commodityBenchmarks) {
            const b = commodityBenchmarks[c];
            b.avg = b.sum / b.count;
        }

        // Group by Market Node (Commodity + Market Location)
        const marketGroups = {};
        for (const r of rawRecords) {
            const key = `${r.commodity}-${r.state}-${r.district}-${r.market}`;
            if (!marketGroups[key]) marketGroups[key] = [];
            marketGroups[key].push(r);
        }

        const out = [];

        // For each node, derive trend boundaries correctly from history and intra-day auction data
        for (const key of Object.keys(marketGroups)) {
            const group = marketGroups[key];
            // Sort Descending (Newest first)
            group.sort((a, b) => this.parseMandiDate(b.date) - this.parseMandiDate(a.date));

            const current = group[0]; // most recent record for this market node
            const historyTokens = group.slice(1);

            let direction = "stable";
            let changePercent = 0.0;
            let trendNote = "";
            let obsCount = historyTokens.length + 1;

            if (historyTokens.length >= 1) {
                // Multi-date history available: compute historical delta
                const avgHistoryPr = historyTokens.reduce((sum, r) => sum + r.modalPrice, 0) / historyTokens.length;
                if (avgHistoryPr > 0) {
                    const diff = ((current.modalPrice - avgHistoryPr) / avgHistoryPr) * 100;
                    changePercent = Number(diff.toFixed(1));
                    if (changePercent > 1.5) {
                        direction = "rising";
                        trendNote = "recent upward trend";
                    } else if (changePercent < -1.5) {
                        direction = "falling";
                        trendNote = "recent downward trend";
                    } else {
                        direction = "stable";
                        trendNote = "steady across observations";
                    }
                }
            } else {
                // Single-date daily arrival: compare against regional commodity benchmark
                const benchmark = commodityBenchmarks[current.commodity];
                if (benchmark && benchmark.count > 1 && benchmark.avg > 0) {
                    const diff = ((current.modalPrice - benchmark.avg) / benchmark.avg) * 100;
                    changePercent = Number(diff.toFixed(1));
                    if (changePercent >= 2.0) {
                        direction = "rising";
                        trendNote = "above regional avg";
                    } else if (changePercent <= -2.0) {
                        direction = "falling";
                        trendNote = "below regional avg";
                    } else {
                        direction = "stable";
                        trendNote = "at regional par";
                    }
                } else {
                    // Evaluate intra-day auction spread (max vs min)
                    const spread = Math.max(0, current.maxPrice - current.minPrice);
                    if (spread > 0) {
                        const pos = (current.modalPrice - current.minPrice) / spread;
                        if (pos >= 0.65) {
                            direction = "rising";
                            trendNote = "upper auction band";
                            changePercent = Number(((pos - 0.5) * 8).toFixed(1));
                        } else if (pos <= 0.35) {
                            direction = "falling";
                            trendNote = "lower auction band";
                            changePercent = Number(((pos - 0.5) * 8).toFixed(1));
                        } else {
                            direction = "stable";
                            trendNote = "mid auction band";
                            changePercent = 0.0;
                        }
                    } else {
                        direction = "stable";
                        trendNote = "single rate auction";
                        changePercent = 0.0;
                    }
                }
            }

            // Auction spread & market turnover activity
            const spread = Math.max(0, current.maxPrice - current.minPrice);
            const spreadPercent = current.modalPrice > 0 ? Number(((spread / current.modalPrice) * 100).toFixed(1)) : 0;

            let activityStatus = "moderate";
            if (spreadPercent >= 8 || spread >= 250) {
                activityStatus = "high";
            } else if (spreadPercent >= 1.5 || spread > 0) {
                activityStatus = "moderate";
            } else {
                activityStatus = "steady";
            }

            // In Agmarknet daily arrival records, arrival is reported today
            const arrivals = {
                current: current.date ? `Active (${current.date})` : "Reported Today",
                status: "Reported Today",
                trend: "active"
            };

            const tradingActivity = {
                spread: spread,
                spreadPercent: spreadPercent,
                status: activityStatus
            };

            // Calculate Demand Signal using the updated multi-factor model
            const demandSignalData = calculateDemandSignal({
                priceTrendDirection: direction,
                arrivalsTrend: arrivals.trend,
                tradingActivityStatus: tradingActivity.status,
                spreadPercent: spreadPercent,
                benchmarkDiff: changePercent
            });

            out.push({
                commodity: current.commodity,
                market: current.market,
                district: current.district,
                state: current.state,
                minPrice: current.minPrice,
                modalPrice: current.modalPrice,
                maxPrice: current.maxPrice,
                unit: current.unit,
                date: current.date,
                intelligence: {
                    priceTrend: {
                        direction: direction,
                        changePercent: changePercent,
                        note: trendNote,
                        observationCount: obsCount
                    },
                    arrivals: arrivals,
                    tradingActivity: tradingActivity,
                    demandSignal: {
                        signal: demandSignalData.signal,
                        reason: demandSignalData.reason
                    }
                }
            });
        }

        // Sort out array by date (Newest to Oldest)
        out.sort((a, b) => this.parseMandiDate(b.date) - this.parseMandiDate(a.date));
        return out;
    }

    /**
     * Extracts valid modal median prices specifically for use in Contextual Recommendation ML mappings.
     * Evaluates crops structurally and compares across matching bounds.
     */
    static async getMarketPricesForRecommendation({ state, district }) {
        try {
            // First pass: Request by District context
            let data = null;
            let locationLevel = 'district';

            if (district && state) {
                // Ensure to wrap in a local soft-block avoiding bubbled errors from main API class
                try {
                    data = await this.getMarketPrices({ state, district, limit: 300 });
                } catch (e) { }
            }

            // Fallback: If no district results, query state-level
            if ((!data || data.records.length < 2) && state) {
                try {
                    data = await this.getMarketPrices({ state, limit: 300 });
                    locationLevel = 'state';
                } catch (e) { }
            }

            if (!data || !data.records || data.records.length === 0) {
                return { prices: {}, locationLevel: 'unavailable' };
            }

            // Group structurally valid valid items maintaining only Fresh/Recent constraints
            const cropGroups = {};

            for (const r of data.records) {
                const freshness = classifyFreshness(r.date);
                if (freshness === 'fresh' || freshness === 'recent') {
                    // Try to map back to ML pipeline representation
                    const internalCrop = this.reverseMapCommodityToCrop(r.commodity);
                    if (internalCrop) {
                        if (!cropGroups[internalCrop]) cropGroups[internalCrop] = [];
                        cropGroups[internalCrop].push(r);
                    }
                }
            }

            // Calculate exact median values per structurally matched candidate
            const aggregatedPrices = {};
            for (const [crop, records] of Object.entries(cropGroups)) {
                // Median pricing math logically isolating extremes/anomalies inside identical local mandi networks
                const sorted = records.sort((a, b) => a.modalPrice - b.modalPrice);
                const mid = Math.floor(sorted.length / 2);
                const medianRecord = sorted[mid]; // Just take the exact midpoint record for its attached intelligence
                const medianPrice = sorted.length % 2 !== 0 ? medianRecord.modalPrice : (sorted[mid - 1].modalPrice + medianRecord.modalPrice) / 2;

                // We use the full intelligence from the closest record (or fallback if it was perfectly even math)
                aggregatedPrices[crop] = {
                    price: medianPrice,
                    date: medianRecord.date,
                    intelligence: medianRecord.intelligence || {
                        priceTrend: { direction: 'unavailable', changePercent: null },
                        demandSignal: { signal: 'Unavailable', reason: 'Context insufficient' }
                    }
                };
            }

            return {
                prices: aggregatedPrices,
                locationLevel: Object.keys(aggregatedPrices).length > 0 ? locationLevel : 'unavailable'
            };
        } catch (e) {
            console.error("[MarketService] Fallback unavailable", e.message);
            return { prices: {}, locationLevel: 'unavailable' };
        }
    }

    /**
     * Robust reverse mapping of Mandi/Agmarknet commodity names to canonical 22 ML crop targets.
     * Handles case variations, whitespace, punctuation/parentheses, and documented aliases.
     * Safely returns null for unknown, ambiguous, or out-of-scope commodities (no unsafe fuzzy guessing).
     */
    static reverseMapCommodityToCrop(mandiCommodity) {
        if (!mandiCommodity || typeof mandiCommodity !== 'string') {
            return null;
        }

        const raw = mandiCommodity.trim();
        if (!raw) return null;

        // 1. Direct exact lowercase lookup (preserves 100% backward compatibility)
        const lowerSearch = raw.toLowerCase();
        if (EXACT_REVERSE_COMMODITY_MAP[lowerSearch]) {
            return EXACT_REVERSE_COMMODITY_MAP[lowerSearch];
        }

        // 2. Normalized alphanumeric lookup (strips whitespace, parentheses, dashes, punctuation)
        const cleanKey = lowerSearch.replace(/[^a-z0-9]/g, '');
        if (cleanKey && NORMALIZED_COMMODITY_MAP[cleanKey]) {
            return NORMALIZED_COMMODITY_MAP[cleanKey];
        }

        // 3. Fallback: Unmapped or out-of-scope commodity (safe null)
        return null;
    }

    static mapCropToMarketCommodity(localCropName) {
        const lower = localCropName.toLowerCase().trim();
        const mappings = {
            'rice': 'Paddy(Dhan)(Common)',
            'chickpea': 'Bengal Gram(Gram)(Whole)',
            'maize': 'Maize',
            'kidneybeans': 'Rajgir',
            'pigeonpeas': 'Arhar (Tur/Red Gram)(Whole)',
            'mothbeans': 'Moth Dal',
            'mungbean': 'Green Gram (Moong)(Whole)',
            'blackgram': 'Black Gram (Urd Beans)(Whole)',
            'lentil': 'Lentil (Masur)(Whole)',
            'pomegranate': 'Pomegranate',
            'banana': 'Banana',
            'mango': 'Mango',
            'grapes': 'Grapes',
            'watermelon': 'Water Melon',
            'muskmelon': 'Kharbuja',
            'apple': 'Apple',
            'orange': 'Orange',
            'papaya': 'Papaya',
            'coconut': 'Coconut',
            'cotton': 'Cotton',
            'jute': 'Jute',
            'coffee': 'Coffee'
        };

        return mappings[lower] || localCropName;
    }

    static normalizeRecord(record) {
        // Validate Date directly
        if (!record || !record.arrival_date || !this.parseMandiDate(record.arrival_date)) {
            return null; // Exclude missing/invalid dates rather than pretending they are current
        }

        // Clean price strings by removing commas and trimming
        const cleanPrice = (val) => {
            if (val === null || val === undefined) return NaN;
            if (typeof val === 'number') return val;
            const s = String(val).replace(/,/g, '').trim();
            return Number(s);
        };

        const minP = cleanPrice(record.min_price);
        const maxP = cleanPrice(record.max_price);
        const modP = cleanPrice(record.modal_price);

        // Numeric / Finite check
        if (!isFinite(minP) || minP < 0 || !isFinite(maxP) || maxP < 0 || !isFinite(modP) || modP < 0) {
            return null;
        }

        // Logical Consistency Check
        if (minP > modP || modP > maxP) {
            return null; // Don't flip values silently. Exclude completely malformed datasets.
        }

        return {
            commodity: record.commodity ? String(record.commodity).trim() : 'Unknown',
            market: record.market ? String(record.market).trim() : 'Unknown',
            state: record.state ? String(record.state).trim() : 'Unknown',
            district: record.district ? String(record.district).trim() : 'Unknown',
            minPrice: minP,
            maxPrice: maxP,
            modalPrice: modP,
            unit: 'quintal', // Standard Mandi pricing organically preserved
            date: String(record.arrival_date).trim(),
            demand: null,
            demandStatus: 'unavailable'
        };
    }

    static parseMandiDate(dateString) {
        if (!dateString) return null;
        const str = String(dateString).trim();
        const parts = str.split(/[\/\-]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d;
            } else {
                // DD/MM/YYYY or DD-MM-YYYY
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d;
            }
        } else {
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    }
}
