# Step 24.13 — Mandi Commodity Normalization & Manual Location Fallback

**Project**: KrishiMitra AI — AI-Based Crop Recommendation System  
**Workspace Path**: `C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final`  
**Date**: October 2026  
**Status**: `COMPLETED & FULLY VERIFIED` (106/106 Unit Tests Passed; 0 Regressions)

---

## 1. Executive Summary & Objectives

In the Step 24.11 Fresh SRS Compliance Audit, two critical gaps were identified in the agricultural market intelligence and recommendation subsystems:

1. **GAP-06 (`FR-MARKET-09`) — Brittle Mandi Commodity Reverse Mapping**:
   `MarketService.reverseMapCommodityToCrop` previously relied on an exact lowercase dictionary lookup. Real-world data feeds from the Government of India Open Government Data (OGD / Data.gov.in / Agmarknet) frequently contain variations in casing, whitespace, punctuation (e.g. hyphens, parentheses), and commodity aliases (such as `Paddy (Dhan) (Common)`, `Arhar (Tur / Red Gram) (Whole)`, `Gram (Chana)`, `Rajma`, `Moong`, `Urad`, `Kapas`, `Pat`). These caused silent reverse-lookup misses, preventing localized mandi prices from factoring into recommendations.

2. **GAP-08 (`FR-RECOMMEND-08`) — Reverse Geocoding Single Point of Failure**:
   OSM Nominatim reverse geocoding is a free public endpoint with no SLA, variable network latency, and strict rate limits. When reverse geocoding timed out, returned null, or when farm coordinates were absent, the recommendation system defaulted directly to national market averages. Farmers had no UI mechanism to specify their State and District for accurate local mandi market context.

### Scope Constraints Strictly Respected
* **Zero Alteration to the 7-Feature ML Contract**: State and District are strictly isolated to market intelligence retrieval and are **never** injected into the 7 canonical inputs (`nitrogen`, `phosphorus`, `potassium`, `temperature`, `humidity`, `pH`, `rainfall`) sent to the ML service or `MLInputBuilder`.
* **Zero Unsafe Fuzzy Matching**: Guarantees no false positive matches (e.g., `Wheat`, `Tomato`, `Soyabean`, or empty values safely return `null` rather than guessing a wrong crop).
* **Deterministic Location Precedence**: Auto reverse-geocoding from verified farm coordinates takes primary precedence; user manual State/District is used when coordinates are unavailable or reverse-geocoding fails/times out; national fallback is used when neither is present.

---

## 2. Implementation Details

### 2.1 Multi-Tier Commodity Normalization ([`market.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/services/market.service.js))

The reverse mapping logic in `MarketService.reverseMapCommodityToCrop` was upgraded to a 3-tier matching engine:

1. **Tier 1 — Exact Lowercase Baseline (`EXACT_REVERSE_COMMODITY_MAP`)**:
   Maintains 100% backward compatibility for all 22 canonical crop keys.
2. **Tier 2 — Normalized Alphanumeric & Documented Alias Lookup (`NORMALIZED_COMMODITY_MAP`)**:
   Normalizes the raw commodity string with `lower.replace(/[^a-z0-9]/g, '')` and matches against comprehensive Indian Agmarknet/OGD aliases:
   * **Rice**: `Paddy (Dhan) (Common)`, `Paddy`, `Dhan`, `Basmati Rice`
   * **Chickpea**: `Gram (Chana)`, `Chana`, `Bengal Gram`, `Kabulichana`
   * **Pigeonpeas**: `Arhar (Tur / Red Gram) (Whole)`, `Tur`, `Arhar`, `Red Gram`, `Tuvar`, `Toor`
   * **Kidneybeans**: `Rajma`, `Rajmash`, `Rajgir`
   * **Mungbean**: `Green Gram (Moong)`, `Moong`, `Mung (Green Gram)`
   * **Blackgram**: `Black Gram (Urd)`, `Urad`, `Urd`, `Mash`
   * **Lentil**: `Masur`, `Masoor`
   * **Muskmelon / Watermelon**: `Kharbuja`, `Cantaloupe`, `Tarbooj`, `Tarbuz`
   * **Fruits**: `Kela` (Banana), `Aam` (Mango), `Angoor` (Grapes), `Santra` / `Mosambi` / `Sweet Orange` (Orange), `Seb` (Apple), `Nariyal` / `Copra` (Coconut)
   * **Commercial / Cash Crops**: `Kapas` / `Cotton (Lint)` (Cotton), `Pat` / `Raw Jute` (Jute), `Coffee Arabica` / `Coffee Robusta` (Coffee)
3. **Tier 3 — Safe Null Fallback**:
   Unmapped, unsupported, or ambiguous commodities (e.g., `Wheat`, `Tomato`, `Soyabean`, `Sugarcane`, or empty/invalid inputs) safely return `null` without throwing errors or guessing.

### 2.2 Recommendation Location Precedence ([`recommendation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/services/recommendation.service.js))

The recommendation pipeline now accepts optional `state` and `district` inputs and executes a clean precedence hierarchy:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   Location Precedence Hierarchy                        │
  └────────────────────────────────────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
  [Farm Coordinates Available?]                             [No Coordinates]
         │                                                         │
  Attempt reverseGeocode                                           │
         │                                                         │
    ┌────┴────────────────────────┐                                │
    ▼                             ▼                                ▼
[Success: State Found]    [Fail / Timeout]            [Manual State Selected?]
    │                             │                                │
    ▼                             └───────────────┬────────────────┘
locationSource = 'auto'                           │
state = geo.state                                 ▼
district = geo.district                [Manual State Selected?]
                                            │              │
                                           YES             NO
                                            │              │
                                            ▼              ▼
                                   locationSource = 'manual'   locationSource = 'none'
                                   state = manualState         state = null
                                   district = manualDistrict   district = null
                                                               (National Averages)
```

* **ML Contract Isolation**:
  ```javascript
  const farmData = { nitrogen, phosphorus, potassium, pH };
  const weatherData = { temperature, humidity };
  const rainfallData = { rainfall };
  const canonicalFeatures = MLInputBuilder.build(farmData, weatherData, rainfallData);
  ```
  `state`, `district`, and `locationSource` are strictly kept outside `MLInputBuilder` and `MLServiceClient.predictCrop`.
* **Transparency**:
  `locationSource` (`'auto' | 'manual' | 'none'`) is returned in the recommendation response payload.

### 2.3 Backend Validation & Controller ([`recommendation.validator.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/validators/recommendation.validator.js), [`recommendation.controller.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/controllers/recommendation.controller.js))
* Optional `state` and `district` fields are validated to ensure they are strings under 100 characters when provided.
* `recommendation.controller.js` destructures `state` and `district` and forwards them to `RecommendationService.getCropPrediction`.

### 2.4 Frontend Integration ([`RecommendationForm.jsx`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/components/RecommendationForm.jsx), [`RecommendationResult.jsx`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/components/RecommendationResult.jsx))
* Created [`client/src/constants/indianStates.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/constants/indianStates.js) listing all 28 Indian States.
* Added an accessible "Mandi Market Location (Optional Fallback)" card in `RecommendationForm.jsx` with a State dropdown and District text input.
* `RecommendationResult.jsx` displays the `locationSource` in the Market Context banner (`Auto-resolved from farm coordinates` vs `Manual state/district selection`).

---

## 3. Test Evidence & Results

### 3.1 Step 24.13 Dedicated Test Suite (`server/test_market_normalization_unit.js`)
* **Execution Command**: `node server/test_market_normalization_unit.js`
* **Mode**: Hermetic In-Process Unit Tests (with mocked Nominatim geocode, ML client, and Farm queries)
* **Results**: **106 PASSED, 0 FAILED**

Summary of coverage:
1. **Canonical Reverse Mapping**: All 22 canonical crop commodities verified (22 passed).
2. **Case & Formatting Normalization**: Lowercase, uppercase, camelCase, whitespace trim, multiple spaces, hyphens, parentheses (7 passed).
3. **Agmarknet & OGD Aliases**: 34 verified Indian commodity aliases including Paddy, Arhar, Tur, Chana, Bengal Gram, Rajma, Moong, Urad, Masur, Kharbuja, Tarbooj, Kela, Aam, Angoor, Santra, Mosambi, Nariyal, Kapas, Raw Jute, Coffee Arabica/Robusta (34 passed).
4. **Safe Fallback & False Positive Rejection**: Unmapped crops (Wheat, Tomato, Potato, Onion, Soyabean, Mustard, Garlic, Ginger, Barley, Sugarcane) and invalid inputs (empty string, null, undefined, numbers, objects) safely return `null` (16 passed).
5. **Validator Tests**: Valid payloads with/without state & district, numeric state rejection, boolean district rejection, >100 char limit rejection (7 passed).
6. **Precedence Hierarchy Tests**:
   * Scenario A: Auto reverse-geocode takes precedence over manual state (`locationSource === 'auto'`) (3 passed).
   * ML Contract: Exactly 7 features sent to ML model; `state`, `district`, `locationSource` excluded (4 passed).
   * Scenario B: Manual fallback used when reverse-geocoding fails/times out (`locationSource === 'manual'`) (3 passed).
   * Scenario C: Manual fallback used when farm has no coordinates (`locationSource === 'manual'`) (3 passed).
   * Scenario D: Manual fallback used when `farmId` is omitted (`locationSource === 'manual'`) (2 passed).
   * Scenario E: None fallback (`locationSource === 'none'`, `state === null`) (2 passed).
   * Transparency: `marketUsed`, `marketNote`, `recommendations` array present (3 passed).

### 3.2 Full Regression Suite Summary

| Test Suite | Scope | Assertions | Status |
|:---|:---|:---:|:---:|
| `server/test_farm_unit.js` | Farm CRUD, IDOR, cascades | 61 | ✅ 61 Passed |
| `server/test_disease_info_unit.js` | 26 pathology classes, safety rules | 35 | ✅ 35 Passed |
| `server/test_soilgrids_unit.js` | SoilGrids v2.0 conversion, 15s timeout | 37 | ✅ 37 Passed |
| `server/test_auth_profile_unit.js` | Profile API & KrishiMitra AI branding | 69 | ✅ 69 Passed |
| `server/test_market_normalization_unit.js` | Commodity reverse-mapping & geo fallback | 106 | ✅ 106 Passed |
| `client/test_rainfall_guidance.mjs` | Rainfall input & transparency callout | 37 | ✅ 37 Passed |
| `client/test_navigation.mjs` | Mobile navigation & ARIA attributes | 38 | ✅ 38 Passed |
| `client/test_router.mjs` | React Router v7 routes & protection | 43 | ✅ 43 Passed |
| `client npm run build` | Frontend production bundle | — | ✅ Built in 3.65s |
| **Total Automated Assertions** | **Entire KrishiMitra AI Platform** | **426** | **✅ 426 Passed, 0 Failed** |

---

## 4. Modified & Created Files

1. [`client/src/constants/indianStates.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/constants/indianStates.js) *(Created)*
2. [`server/src/services/market.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/services/market.service.js) *(Updated)*
3. [`server/src/validators/recommendation.validator.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/validators/recommendation.validator.js) *(Updated)*
4. [`server/src/controllers/recommendation.controller.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/controllers/recommendation.controller.js) *(Updated)*
5. [`server/src/services/recommendation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/services/recommendation.service.js) *(Updated)*
6. [`client/src/features/recommendation/components/RecommendationForm.jsx`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/components/RecommendationForm.jsx) *(Updated)*
7. [`client/src/features/recommendation/components/RecommendationResult.jsx`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/components/RecommendationResult.jsx) *(Updated)*
8. [`client/src/features/recommendation/utils/recommendation.validation.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/utils/recommendation.validation.js) *(Updated)*
9. [`server/test_market_normalization_unit.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_market_normalization_unit.js) *(Created)*
10. [`docs/step-24.11-fresh-srs-compliance-audit.md`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.11-fresh-srs-compliance-audit.md) *(Updated)*
11. [`docs/step-24.13-mandi-normalization-and-location-fallback.md`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.13-mandi-normalization-and-location-fallback.md) *(Created)*
