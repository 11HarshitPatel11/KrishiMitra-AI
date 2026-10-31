/**
 * server/test_market_normalization_unit.js
 * ---------------------------------------------------------------------------
 * Unit & Integration Test Suite for Step 24.13:
 * Mandi Commodity Normalization & Recommendation Location Fallback Precedence
 *
 * Mode: In-Process Hermetic Unit Tests (No MongoDB or Network Required)
 * ---------------------------------------------------------------------------
 */

import { MarketService } from './src/services/market.service.js';
import { getMarketInfo } from './src/controllers/market.controller.js';
import { validateRecommendationInput } from './src/validators/recommendation.validator.js';
import { RecommendationService } from './src/services/recommendation.service.js';
import { MLServiceClient } from './src/services/ml.service.js';
import Farm from './src/models/farm.model.js';
import CropHistory from './src/models/cropHistory.model.js';

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label}${detail ? ` (${detail})` : ''}`);
        failed++;
    }
}

console.log("==================================================");
console.log("Step 24.13 Mandi Normalization & Location Fallback");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. Commodity Reverse Mapping & Normalization
// ---------------------------------------------------------------------------
console.log("1. Commodity Reverse Mapping & Normalization (GAP-06)");

const canonical22 = [
    { input: "Rice", expected: "rice" },
    { input: "Maize", expected: "maize" },
    { input: "Chickpea", expected: "chickpea" },
    { input: "Kidneybeans", expected: "kidneybeans" },
    { input: "Pigeonpeas", expected: "pigeonpeas" },
    { input: "Mothbeans", expected: "mothbeans" },
    { input: "Mungbean", expected: "mungbean" },
    { input: "Blackgram", expected: "blackgram" },
    { input: "Lentil", expected: "lentil" },
    { input: "Pomegranate", expected: "pomegranate" },
    { input: "Banana", expected: "banana" },
    { input: "Mango", expected: "mango" },
    { input: "Grapes", expected: "grapes" },
    { input: "Watermelon", expected: "watermelon" },
    { input: "Muskmelon", expected: "muskmelon" },
    { input: "Apple", expected: "apple" },
    { input: "Orange", expected: "orange" },
    { input: "Papaya", expected: "papaya" },
    { input: "Coconut", expected: "coconut" },
    { input: "Cotton", expected: "cotton" },
    { input: "Jute", expected: "jute" },
    { input: "Coffee", expected: "coffee" }
];

for (const { input, expected } of canonical22) {
    const res = MarketService.reverseMapCommodityToCrop(input);
    assert(res === expected, `Canonical exact match for "${input}" -> "${expected}"`, `got "${res}"`);
}

// Case variations
assert(MarketService.reverseMapCommodityToCrop("rice") === "rice", "Lowercase 'rice' -> 'rice'");
assert(MarketService.reverseMapCommodityToCrop("PIGEONPEAS") === "pigeonpeas", "Uppercase 'PIGEONPEAS' -> 'pigeonpeas'");
assert(MarketService.reverseMapCommodityToCrop("KidneyBeans") === "kidneybeans", "Mixed camelCase 'KidneyBeans' -> 'kidneybeans'");

// Whitespace and punctuation
assert(MarketService.reverseMapCommodityToCrop("   Rice   ") === "rice", "Leading and trailing whitespace trimmed");
assert(MarketService.reverseMapCommodityToCrop("Black   gram") === "blackgram", "Internal multiple spaces collapsed");
assert(MarketService.reverseMapCommodityToCrop("Kidney-beans") === "kidneybeans", "Hyphenated 'Kidney-beans' -> 'kidneybeans'");
assert(MarketService.reverseMapCommodityToCrop("Mung (Green Gram)") === "mungbean", "Parenthesized 'Mung (Green Gram)' -> 'mungbean'");

// Documented Indian Agmarknet/OGD Aliases
const aliases = [
    { input: "Paddy (Dhan) (Common)", expected: "rice" },
    { input: "Paddy", expected: "rice" },
    { input: "Dhan", expected: "rice" },
    { input: "Arhar (Tur/Red Gram)(Whole)", expected: "pigeonpeas" },
    { input: "Arhar (Tur / Red Gram) (Whole)", expected: "pigeonpeas" },
    { input: "Tur", expected: "pigeonpeas" },
    { input: "Arhar", expected: "pigeonpeas" },
    { input: "Red Gram", expected: "pigeonpeas" },
    { input: "Gram (Chana)", expected: "chickpea" },
    { input: "Chana", expected: "chickpea" },
    { input: "Bengal Gram", expected: "chickpea" },
    { input: "Rajma", expected: "kidneybeans" },
    { input: "Rajmash", expected: "kidneybeans" },
    { input: "Green Gram (Moong)", expected: "mungbean" },
    { input: "Moong", expected: "mungbean" },
    { input: "Black Gram (Urd)", expected: "blackgram" },
    { input: "Urad", expected: "blackgram" },
    { input: "Masur", expected: "lentil" },
    { input: "Masoor", expected: "lentil" },
    { input: "Kharbuja", expected: "muskmelon" },
    { input: "Tarbooj", expected: "watermelon" },
    { input: "Kela", expected: "banana" },
    { input: "Aam", expected: "mango" },
    { input: "Angoor", expected: "grapes" },
    { input: "Santra", expected: "orange" },
    { input: "Mosambi", expected: "orange" },
    { input: "Sweet Orange", expected: "orange" },
    { input: "Nariyal", expected: "coconut" },
    { input: "Kapas", expected: "cotton" },
    { input: "Cotton (Lint)", expected: "cotton" },
    { input: "Pat", expected: "jute" },
    { input: "Raw Jute", expected: "jute" },
    { input: "Coffee Arabica", expected: "coffee" },
    { input: "Coffee Robusta", expected: "coffee" }
];

for (const { input, expected } of aliases) {
    const res = MarketService.reverseMapCommodityToCrop(input);
    assert(res === expected, `Alias match for "${input}" -> "${expected}"`, `got "${res}"`);
}

// Safe Fallback: Unmapped / Ambiguous Commodities MUST return null
console.log("\n2. Safe Fallback & False Positive Prevention");
const unmapped = [
    "Wheat",
    "Tomato",
    "Potato",
    "Onion",
    "Soyabean",
    "Mustard",
    "Garlic",
    "Ginger",
    "Barley",
    "Sugarcane",
    "",
    "   ",
    null,
    undefined,
    12345,
    {}
];

for (const input of unmapped) {
    const res = MarketService.reverseMapCommodityToCrop(input);
    assert(res === null, `Unmapped/invalid commodity "${JSON.stringify(input)}" safely returns null`, `got "${res}"`);
}

// ---------------------------------------------------------------------------
// 3. Recommendation Validator Tests (Optional State / District)
// ---------------------------------------------------------------------------
console.log("\n3. Recommendation Input Validator Tests");

function testValidator(body) {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = { body };
    const res = {
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => {
                    jsonResponse = data;
                }
            };
        }
    };
    const next = () => { nextCalled = true; };

    validateRecommendationInput(req, res, next);
    return { statusCode, jsonResponse, nextCalled };
}

const validBase = {
    nitrogen: 90,
    phosphorus: 42,
    potassium: 43,
    temperature: 20.8,
    humidity: 82.0,
    pH: 6.5,
    rainfall: 202.9
};

// 3.1 Base valid without state/district
const r1 = testValidator({ ...validBase });
assert(r1.nextCalled === true, "Valid base payload passes without state/district");

// 3.2 Valid with manual state & district
const r2 = testValidator({ ...validBase, state: "Madhya Pradesh", district: "Indore" });
assert(r2.nextCalled === true, "Valid payload passes with state and district");

// 3.3 Valid with state only
const r3 = testValidator({ ...validBase, state: "Punjab" });
assert(r3.nextCalled === true, "Valid payload passes with state only");

// 3.4 Invalid state type (number)
const r4 = testValidator({ ...validBase, state: 12345 });
assert(r4.statusCode === 400, "Rejects numeric state with HTTP 400");
assert(r4.jsonResponse && r4.jsonResponse.errors[0].includes("state"), "Error message mentions state");

// 3.5 Invalid district type (boolean)
const r5 = testValidator({ ...validBase, district: true });
assert(r5.statusCode === 400, "Rejects boolean district with HTTP 400");

// 3.6 Excessively long state (> 100 chars)
const r6 = testValidator({ ...validBase, state: "A".repeat(101) });
assert(r6.statusCode === 400, "Rejects state exceeding 100 characters");

// ---------------------------------------------------------------------------
// 4. Recommendation Location Precedence & Contract Verification
// ---------------------------------------------------------------------------
console.log("\n4. Recommendation Location Precedence & ML Contract Verification (GAP-08)");

async function runPrecedenceTests() {
    // Preserve original methods
    const originalPredictCrop = MLServiceClient.predictCrop;
    const originalGetMarket = MarketService.getMarketPricesForRecommendation;
    const originalFarmFindOne = Farm.findOne;
    const originalHistoryFindOne = CropHistory.findOne;
    const originalFetch = global.fetch;

    let capturedMLFeatures = null;
    let capturedMarketLocation = null;
    let nominatimMockResponse = null;

    // Mock global.fetch for Nominatim reverseGeocode
    global.fetch = async (url, options) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('nominatim.openstreetmap.org')) {
            if (nominatimMockResponse) {
                return {
                    ok: true,
                    json: async () => nominatimMockResponse
                };
            } else {
                return {
                    ok: false,
                    status: 500,
                    json: async () => ({})
                };
            }
        }
        return originalFetch(url, options);
    };

    // Mock MLServiceClient
    MLServiceClient.predictCrop = async (features) => {
        capturedMLFeatures = features;
        return {
            status: "success",
            data: {
                recommendations: [
                    { crop: "rice", probability: 0.92 },
                    { crop: "maize", probability: 0.85 }
                ]
            }
        };
    };

    // Mock MarketService
    MarketService.getMarketPricesForRecommendation = async ({ state, district }) => {
        capturedMarketLocation = { state, district };
        return {
            locationLevel: state ? (district ? "district" : "state") : "national",
            prices: {
                rice: { price: 2100, date: "2026-10-24" },
                maize: { price: 1850, date: "2026-10-24" }
            }
        };
    };

    // Mock CropHistory
    CropHistory.findOne = () => ({
        sort: () => Promise.resolve(null)
    });

    try {
        // --- TEST 4A: Precedence Auto over Manual ---
        // Farm coordinates reverse-geocode successfully -> Auto takes precedence over manual input
        nominatimMockResponse = {
            address: {
                state: "Madhya Pradesh",
                state_district: "Indore"
            }
        };

        Farm.findOne = async () => ({
            _id: "507f1f77bcf86cd799439011",
            farmName: "Test Farm",
            latitude: 22.7196,
            longitude: 75.8577
        });

        const resAuto = await RecommendationService.getCropPrediction({
            ...validBase,
            farmId: "507f1f77bcf86cd799439011",
            userId: "user-123",
            state: "Maharashtra", // User provided manual fallback, but auto should win
            district: "Pune"
        });

        assert(resAuto.locationSource === "auto", "Scenario A: Auto reverse-geocode takes precedence over manual state (locationSource === 'auto')");
        assert(capturedMarketLocation.state === "Madhya Pradesh", `Scenario A: Market query used auto state 'Madhya Pradesh' (got '${capturedMarketLocation.state}')`);
        assert(capturedMarketLocation.district === "Indore", `Scenario A: Market query used auto district 'Indore' (got '${capturedMarketLocation.district}')`);

        // Check 7-feature ML input contract
        const featureKeys = Object.keys(capturedMLFeatures);
        assert(featureKeys.length === 7, `ML contract: Exactly 7 features sent to ML model (got ${featureKeys.length})`);
        assert(!('state' in capturedMLFeatures), "ML contract: 'state' is NOT sent to ML service");
        assert(!('district' in capturedMLFeatures), "ML contract: 'district' is NOT sent to ML service");
        assert(!('locationSource' in capturedMLFeatures), "ML contract: 'locationSource' is NOT sent to ML service");

        // --- TEST 4B: Manual Fallback when reverseGeocode fails/times out ---
        nominatimMockResponse = null; // Nominatim returns error / unresolvable

        const resManualOnGeoFail = await RecommendationService.getCropPrediction({
            ...validBase,
            farmId: "507f1f77bcf86cd799439011",
            userId: "user-123",
            state: "Maharashtra",
            district: "Pune"
        });

        assert(resManualOnGeoFail.locationSource === "manual", "Scenario B: Manual fallback used when reverse-geocoding fails (locationSource === 'manual')");
        assert(capturedMarketLocation.state === "Maharashtra", "Scenario B: Market query received manual fallback state 'Maharashtra'");
        assert(capturedMarketLocation.district === "Pune", "Scenario B: Market query received manual fallback district 'Pune'");

        // --- TEST 4C: Manual Fallback when Farm has no coordinates ---
        Farm.findOne = async () => ({
            _id: "507f1f77bcf86cd799439012",
            farmName: "Farm Without Coords",
            latitude: null,
            longitude: null
        });

        const resManualNoCoords = await RecommendationService.getCropPrediction({
            ...validBase,
            farmId: "507f1f77bcf86cd799439012",
            userId: "user-123",
            state: "Karnataka",
            district: "Mysuru"
        });

        assert(resManualNoCoords.locationSource === "manual", "Scenario C: Manual fallback used when farm lacks coordinates (locationSource === 'manual')");
        assert(capturedMarketLocation.state === "Karnataka", "Scenario C: Market query received manual state 'Karnataka'");
        assert(capturedMarketLocation.district === "Mysuru", "Scenario C: Market query received manual district 'Mysuru'");

        // --- TEST 4D: Manual Fallback when FarmId is not provided ---
        Farm.findOne = async () => null;

        const resManualNoFarm = await RecommendationService.getCropPrediction({
            ...validBase,
            state: "Rajasthan",
            district: "Jaipur"
        });

        assert(resManualNoFarm.locationSource === "manual", "Scenario D: Manual state used when farmId is not provided (locationSource === 'manual')");
        assert(capturedMarketLocation.state === "Rajasthan", "Scenario D: Market query received manual state 'Rajasthan'");

        // --- TEST 4E: None Fallback (National) when neither coordinates nor manual state is provided ---
        const resNone = await RecommendationService.getCropPrediction({
            ...validBase
        });

        assert(resNone.locationSource === "none", "Scenario E: locationSource is 'none' when neither coordinates nor manual state is provided");
        assert(capturedMarketLocation.state === null, "Scenario E: Market query received null state (national fallback)");

        // --- TEST 4F: Transparency & Response Fields ---
        assert(resAuto.marketUsed === true, "Response includes marketUsed boolean");
        assert(typeof resAuto.marketNote === 'string' && resAuto.marketNote.length > 0, "Response includes informative marketNote");
        assert(Array.isArray(resAuto.recommendations) && resAuto.recommendations.length > 0, "Response includes recommendations array");

    } finally {
        // Restore originals
        MLServiceClient.predictCrop = originalPredictCrop;
        MarketService.getMarketPricesForRecommendation = originalGetMarket;
        Farm.findOne = originalFarmFindOne;
        CropHistory.findOne = originalHistoryFindOne;
        global.fetch = originalFetch;
    }
}

await runPrecedenceTests();

// ---------------------------------------------------------------------------
// 5. Step 24.31 Market Price Service & Controller Regression Tests
// ---------------------------------------------------------------------------
console.log("\n5. Market Price Normalization & Service Error Handling (Step 24.31)");

// 5.1 Date Parsing
const dSlash = MarketService.parseMandiDate("24/10/2026");
assert(dSlash instanceof Date && dSlash.getFullYear() === 2026 && dSlash.getMonth() === 9 && dSlash.getDate() === 24, "parseMandiDate parses 'DD/MM/YYYY' correctly");

const dDash = MarketService.parseMandiDate("24-10-2026");
assert(dDash instanceof Date && dDash.getFullYear() === 2026 && dDash.getMonth() === 9 && dDash.getDate() === 24, "parseMandiDate parses 'DD-MM-YYYY' correctly");

const dIso = MarketService.parseMandiDate("2026-10-24");
assert(dIso instanceof Date && dIso.getFullYear() === 2026 && dIso.getMonth() === 9 && dIso.getDate() === 24, "parseMandiDate parses 'YYYY-MM-DD' correctly");

assert(MarketService.parseMandiDate("") === null, "parseMandiDate returns null on empty string");
assert(MarketService.parseMandiDate(null) === null, "parseMandiDate returns null on null input");
assert(MarketService.parseMandiDate("invalid-date") === null, "parseMandiDate returns null on invalid string");

// 5.2 Record Normalization & Comma-Separated Price Handling
const cleanRec = MarketService.normalizeRecord({
    commodity: "  Paddy(Dhan)(Common)  ",
    state: "  Madhya Pradesh  ",
    district: "  Indore  ",
    market: "  Indore Mandi  ",
    min_price: "2,000",
    modal_price: "2,150.50",
    max_price: "2,300",
    arrival_date: "24/10/2026"
});

assert(cleanRec !== null, "normalizeRecord succeeds for valid comma-formatted record");
assert(cleanRec && cleanRec.minPrice === 2000, "normalizeRecord strips commas from min_price ('2,000' -> 2000)");
assert(cleanRec && cleanRec.modalPrice === 2150.50, "normalizeRecord handles decimals in comma strings ('2,150.50' -> 2150.50)");
assert(cleanRec && cleanRec.maxPrice === 2300, "normalizeRecord strips commas from max_price ('2,300' -> 2300)");
assert(cleanRec && cleanRec.commodity === "Paddy(Dhan)(Common)", "normalizeRecord trims commodity text");
assert(cleanRec && cleanRec.state === "Madhya Pradesh", "normalizeRecord trims state text");
assert(cleanRec && cleanRec.unit === "quintal", "normalizeRecord preserves quintal unit");

// 5.3 Inverted & Invalid Price Safety Checks
const invertedRec = MarketService.normalizeRecord({
    commodity: "Rice",
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana",
    min_price: "2500",
    modal_price: "2100", // modal < min is invalid
    max_price: "3000",
    arrival_date: "24/10/2026"
});
assert(invertedRec === null, "normalizeRecord rejects inverted prices where min_price > modal_price");

const negRec = MarketService.normalizeRecord({
    commodity: "Rice",
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana",
    min_price: "-100",
    modal_price: "2100",
    max_price: "3000",
    arrival_date: "24/10/2026"
});
assert(negRec === null, "normalizeRecord rejects negative prices");

const nanRec = MarketService.normalizeRecord({
    commodity: "Rice",
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana",
    min_price: "N/A",
    modal_price: "2100",
    max_price: "3000",
    arrival_date: "24/10/2026"
});
assert(nanRec === null, "normalizeRecord rejects non-numeric price strings ('N/A')");

const noDateRec = MarketService.normalizeRecord({
    commodity: "Rice",
    state: "Punjab",
    district: "Ludhiana",
    market: "Ludhiana",
    min_price: "2000",
    modal_price: "2100",
    max_price: "2200",
    arrival_date: ""
});
assert(noDateRec === null, "normalizeRecord rejects missing arrival_date");

// 5.4 Market Service Error Scenarios
async function runMarketServiceTests() {
    const originalApiKey = process.env.MARKET_API_KEY;
    const originalBaseUrl = process.env.MARKET_API_BASE_URL;
    const originalFetch = global.fetch;

    try {
        // Missing Base URL
        delete process.env.MARKET_API_BASE_URL;
        let missingBaseErr = null;
        try {
            await MarketService.getMarketPrices({});
        } catch (e) {
            missingBaseErr = e;
        }
        assert(missingBaseErr && missingBaseErr.code === 'CONFIG_MISSING', "Throws CONFIG_MISSING when MARKET_API_BASE_URL is absent");

        // Missing API Key
        process.env.MARKET_API_BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
        delete process.env.MARKET_API_KEY;
        let missingKeyErr = null;
        try {
            await MarketService.getMarketPrices({});
        } catch (e) {
            missingKeyErr = e;
        }
        assert(missingKeyErr && missingKeyErr.code === 'CONFIG_MISSING', "Throws CONFIG_MISSING when MARKET_API_KEY is absent");

        // Placeholder API Key
        process.env.MARKET_API_KEY = "YOUR_API_KEY_HERE";
        let placeholderKeyErr = null;
        try {
            await MarketService.getMarketPrices({});
        } catch (e) {
            placeholderKeyErr = e;
        }
        assert(placeholderKeyErr && placeholderKeyErr.code === 'CONFIG_MISSING', "Throws CONFIG_MISSING when MARKET_API_KEY is placeholder");

        // Set valid test key and mock external fetch for network/API scenarios
        process.env.MARKET_API_KEY = "test_valid_key";

        // External 500 error
        global.fetch = async () => ({
            ok: false,
            status: 502,
            statusText: "Bad Gateway"
        });
        let httpFailErr = null;
        try {
            await MarketService.getMarketPrices({});
        } catch (e) {
            httpFailErr = e;
        }
        assert(httpFailErr && httpFailErr.code === 'SERVICE_UNAVAILABLE', "Throws SERVICE_UNAVAILABLE when external API returns HTTP 502");

        // External 200 with JSON error payload (Data.gov.in invalid key response)
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                status: "failed",
                message: "Invalid API Key or unauthorized access"
            })
        });
        let payloadFailErr = null;
        try {
            await MarketService.getMarketPrices({});
        } catch (e) {
            payloadFailErr = e;
        }
        assert(payloadFailErr && payloadFailErr.code === 'SERVICE_UNAVAILABLE', "Throws SERVICE_UNAVAILABLE when external API returns status 'failed' payload");

        // External 200 with valid records
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                status: "ok",
                records: [
                    {
                        commodity: "Paddy(Dhan)(Common)",
                        state: "Madhya Pradesh",
                        district: "Indore",
                        market: "Indore Mandi",
                        min_price: "2,000",
                        modal_price: "2,100",
                        max_price: "2,200",
                        arrival_date: "24/10/2026"
                    }
                ]
            })
        });
        const successRes = await MarketService.getMarketPrices({ limit: 5 });
        assert(successRes && successRes.records.length === 1, "Returns normalized records on valid external response");
        assert(successRes.records[0].modalPrice === 2100, "Valid record contains parsed numeric modalPrice 2100");
        assert(successRes.metadata && successRes.metadata.source === "Government of India OGD", "Metadata includes Government of India OGD source");

    } finally {
        process.env.MARKET_API_KEY = originalApiKey;
        process.env.MARKET_API_BASE_URL = originalBaseUrl;
        global.fetch = originalFetch;
    }
}

await runMarketServiceTests();

// 5.5 Market Controller Response Status & Codes
console.log("\n6. Market Controller HTTP Responses (Step 24.31)");

async function testMarketControllerScenario(mockServiceFn) {
    const originalGetMarketPrices = MarketService.getMarketPrices;
    MarketService.getMarketPrices = mockServiceFn;

    let responseStatus = null;
    let responseJson = null;

    const req = { query: { commodity: "rice", state: "Punjab" } };
    const res = {
        status: (code) => {
            responseStatus = code;
            return {
                json: (data) => {
                    responseJson = data;
                }
            };
        }
    };
    const next = (err) => {
        responseStatus = 500;
        responseJson = { error: err.message };
    };

    try {
        await getMarketInfo(req, res, next);
        return { status: responseStatus, json: responseJson };
    } finally {
        MarketService.getMarketPrices = originalGetMarketPrices;
    }
}

// Controller Test 1: Config Missing -> 503 CONFIG_MISSING
const c1 = await testMarketControllerScenario(async () => {
    const err = new Error("Market API Key is missing.");
    err.code = 'CONFIG_MISSING';
    throw err;
});
assert(c1.status === 503, "Controller returns HTTP 503 when config is missing");
assert(c1.json.code === 'CONFIG_MISSING', "Controller response includes code 'CONFIG_MISSING'");
assert(c1.json.message === "Market prices are temporarily unavailable. Please try again later.", "Controller returns standard user-facing unavailable message");

// Controller Test 2: Service Unavailable -> 503 SERVICE_UNAVAILABLE
const c2 = await testMarketControllerScenario(async () => {
    const err = new Error("Market Service Unavailable");
    err.code = 'SERVICE_UNAVAILABLE';
    throw err;
});
assert(c2.status === 503, "Controller returns HTTP 503 when external service is unavailable");
assert(c2.json.code === 'SERVICE_UNAVAILABLE', "Controller response includes code 'SERVICE_UNAVAILABLE'");
assert(c2.json.message === "Market prices are temporarily unavailable. Please try again later.", "Controller returns standard user-facing unavailable message");

// Controller Test 3: Zero Matching Results -> 200 with standard message
const c3 = await testMarketControllerScenario(async () => {
    return {
        records: [],
        metadata: { source: "Government of India OGD", latestDataDate: "Unknown", freshness: "stale" }
    };
});
assert(c3.status === 200, "Controller returns HTTP 200 when search returns zero results");
assert(c3.json.success === true, "Controller response has success: true for zero results");
assert(c3.json.message === "No market records match your selected filters", "Controller returns exact message 'No market records match your selected filters'");
assert(Array.isArray(c3.json.data.records) && c3.json.data.records.length === 0, "Controller records array is empty");

// Controller Test 4: Success with records -> 200
const c4 = await testMarketControllerScenario(async () => {
    return {
        records: [{ commodity: "Rice", modalPrice: 2100 }],
        metadata: { source: "Government of India OGD", latestDataDate: "24/10/2026", freshness: "fresh" }
    };
});
assert(c4.status === 200, "Controller returns HTTP 200 when records found");
assert(c4.json.success === true, "Controller response has success: true");
assert(c4.json.message === "Market information retrieved successfully", "Controller returns 'Market information retrieved successfully'");
assert(c4.json.data.records.length === 1, "Controller returns records in data payload");

console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
