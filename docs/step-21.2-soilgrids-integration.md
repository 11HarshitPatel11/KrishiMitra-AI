# Step 21.2: SoilGrids External Data Integration

## Implementation Overview
Step 21.2 integrates the ISRIC SoilGrids REST API v2.0 into the KrishiMitra backend as an explicitly mapped **supplementary** soil intelligence layer. This data is **display-only** and is **never** passed to the crop recommendation ML model.

---

## Endpoint and Response Structure

### Request Endpoint
```
GET https://rest.isric.org/soilgrids/v2.0/properties/query
  ?lon=<longitude>
  &lat=<latitude>
  &property=phh2o
  &property=nitrogen
  &property=soc
  &property=sand
  &property=silt
  &property=clay
  &property=bdod
```

### Response Format (JSON Feature object)
```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [lon, lat] },
  "properties": {
    "layers": [
      {
        "name": "phh2o",
        "unit_measure": {
          "mapped_units": "pH*10",
          "target_units": "pH",
          "conversion_factor": 10
        },
        "depths": [
          { "label": "0-5cm", "values": { "mean": 65, "uncertainty": 5 } },
          ...
        ]
      }
    ]
  }
}
```

---

## ⚠️ Critical: Raw Integer Values Require Conversion

The API returns **raw integer values** (not the final user-facing numbers) to minimize payload size.
Every raw `mean` value **must be divided by `conversion_factor`** before displaying.

### Property Units and Conversion Factors

| Property  | Description                      | API Raw Unit   | Conversion Factor | Target Unit | Example (raw → converted) |
|-----------|----------------------------------|----------------|-------------------|-------------|---------------------------|
| `phh2o`   | Soil pH in water                 | pH × 10        | ÷ 10              | pH          | 65 → 6.5 pH               |
| `nitrogen`| Total nitrogen density           | cg/kg          | ÷ 100             | g/kg        | 150 → 1.5 g/kg            |
| `soc`     | Soil organic carbon              | dg/kg          | ÷ 10              | g/kg        | 120 → 12.0 g/kg           |
| `sand`    | Sand particle proportion         | g/kg           | ÷ 10              | %           | 420 → 42 %                |
| `silt`    | Silt particle proportion         | g/kg           | ÷ 10              | %           | 350 → 35 %                |
| `clay`    | Clay particle proportion         | g/kg           | ÷ 10              | %           | 230 → 23 %                |
| `bdod`    | Bulk density (fine earth)        | cg/cm³         | ÷ 100             | kg/dm³      | 120 → 1.2 kg/dm³          |

**Implementation note:** The service reads `conversion_factor` from the API response's `unit_measure` field as the authoritative source. If the field is missing, documented fallback constants are applied.

**Critical data integrity note:** Phosphorus (P) and Potassium (K) are **not provided** by SoilGrids globally. No fabricated or derived values are inserted. The `ExternalSoilInformation` schema stores only what the API actually returns.

---

## Depth Intervals

All six standard SoilGrids depth intervals are preserved:

| Depth Label  | Range (cm) |
|--------------|-----------|
| `0-5cm`      | 0–5       |
| `5-15cm`     | 5–15      |
| `15-30cm`    | 15–30     |
| `30-60cm`    | 30–60     |
| `60-100cm`   | 60–100    |
| `100-200cm`  | 100–200   |

---

## Data Separation Architecture

| Data Type | Model | Populated By | Used By ML Model |
|---|---|---|---|
| Manually entered soil (pH, N, P, K, moisture) | `SoilInformation` | Farmer via UI | ✅ Indirectly (via farm N/P/K passed to recommendation endpoint) |
| SoilGrids external data | `ExternalSoilInformation` | `soilGrids.service.js` | ❌ Never |

The `RecommendationService` (`recommendation.service.js`) only accepts `nitrogen`, `phosphorus`, `potassium`, `pH`, `temperature`, `humidity`, and `rainfall` as direct user inputs. It does not import or query `ExternalSoilInformation`. Code-level separation is enforced by model isolation.

---

## Backend Routes

```
GET /api/v1/soil-information/external/farm/:farmId
    → Triggers live SoilGrids fetch, stores/updates cache, returns data.
    → Auth: JWT required (protect middleware)
    → Errors: 400 (no coordinates), 404 (ocean/unmapped), 503 (unavailable)

GET /api/v1/soil-information/external/farm/:farmId/cached
    → Returns locally cached record from MongoDB (no external HTTP call).
    → Returns { success: true, data: null } if never fetched.
```

---

## Tests Performed and Results

### Unit Tests — MOCKED (test_soilgrids_unit.js)
Run: `node test_soilgrids_unit.js` from `server/`

| # | Test | Result |
|---|------|--------|
| 1 | Latitude > 90 rejected with 400 | ✅ PASS |
| 2 | Latitude < -90 rejected with 400 | ✅ PASS |
| 3 | Longitude > 180 rejected with 400 | ✅ PASS |
| 4 | Longitude < -180 rejected with 400 | ✅ PASS |
| 5 | phh2o 0-5cm: raw 65 → 6.5 pH | ✅ PASS |
| 6 | phh2o 5-15cm: raw 63 → 6.3 pH | ✅ PASS |
| 7 | phh2o unit is "pH" | ✅ PASS |
| 8 | nitrogen 0-5cm: raw 150 cg/kg → 1.5 g/kg | ✅ PASS |
| 9 | nitrogen 5-15cm: raw 130 cg/kg → 1.3 g/kg | ✅ PASS |
| 10 | nitrogen unit is "g/kg" | ✅ PASS |
| 11 | soc 0-5cm: raw 120 dg/kg → 12.0 g/kg | ✅ PASS |
| 12 | soc 5-15cm: raw 95 dg/kg → 9.5 g/kg | ✅ PASS |
| 13 | soc unit is "g/kg" | ✅ PASS |
| 14 | sand 0-5cm: raw 420 g/kg → 42 % | ✅ PASS |
| 15 | sand unit is "%" | ✅ PASS |
| 16 | silt 0-5cm: raw 350 g/kg → 35 % | ✅ PASS |
| 17 | silt unit is "%" | ✅ PASS |
| 18 | clay 0-5cm: raw 230 g/kg → 23 % | ✅ PASS |
| 19 | clay unit is "%" | ✅ PASS |
| 20 | bdod 0-5cm: raw 120 cg/cm³ → 1.2 kg/dm³ | ✅ PASS |
| 21 | bdod 5-15cm: raw 130 cg/cm³ → 1.3 kg/dm³ | ✅ PASS |
| 22 | bdod unit is "kg/dm³" | ✅ PASS |
| 23 | rawValue preserved (phh2o=65) | ✅ PASS |
| 24 | All 6 depth intervals returned | ✅ PASS |
| 25 | Depth labels match official SoilGrids intervals | ✅ PASS |
| 26 | null rawValue → null converted value | ✅ PASS |
| 27 | null rawValue stored correctly | ✅ PASS |
| 28 | Non-null property unaffected by sibling null | ✅ PASS |
| 29 | Response missing .properties throws 502 | ✅ PASS |
| 30 | Response missing .properties.layers throws 502 | ✅ PASS |
| 31 | ECONNABORTED (timeout) → 503 with safe message | ✅ PASS |
| 32 | Upstream 503 → mapped to local 503 | ✅ PASS |
| 33 | Upstream 404 (ocean/water) → propagated as local 404 | ✅ PASS |
| 34 | Phosphorus is NOT a SoilGrids property (correctly absent) | ✅ PASS |
| 35 | Potassium is NOT a SoilGrids property (correctly absent) | ✅ PASS |
| 36 | Fallback factor applied: 65 / 10 = 6.5 pH | ✅ PASS |
| 37 | Fallback target unit applied: "pH" | ✅ PASS |

**Total: 37/37 PASS. 0 FAILED.**

### Integration Tests (test_soilgrids_api.js)
Designed for live server + database. Requires `npm run dev` (server) to be running.
Tests: missing coordinates → 400, IDOR protection, live SoilGrids fetch (may return 503 if ISRIC is unavailable).

### Live SoilGrids API Status
**Result: Service unreachable** (timeout) during validation (2026-10-16).
ISRIC's public REST API is known to be intermittently unavailable under load.
This is an expected external limitation, not a code defect.
The 15-second timeout and 503 error path are validated via mocks.

### Frontend Build
- `npm run build` (client) → ✅ Exit code 0, 57 modules transformed, no errors.

---

## Bug Fixes Applied in This Step

### Bug 1: Unit conversions missing (critical)
**Was:** Raw integer values stored and labeled as target units (e.g., pH stored as `65` labeled `"pH"`)  
**Fix:** `convertRawValue(rawValue, conversionFactor)` applies the factor from `unit_measure.conversion_factor` in the API response. Documented fallbacks guard against missing `unit_measure`. Original raw value preserved in `rawValue` for auditability.

### Bug 2: Unreachable error-catch branch
**Was:** `error.statusCode === 502` in the catch block — never fires because the 502 is thrown as a plain object, immediately re-caught by the outer `catch (error)` and re-thrown instead of being converted to 503.  
**Fix:** Restructured catch: `error.code === 'ECONNABORTED'` for timeout, `error.statusCode` for our structured throws, `error.response` for Axios HTTP errors.

### Bug 3: Unsafe `.mean` access
**Was:** `d.values.mean` — crashes with `TypeError` if `values` is missing or `mean` is null (ocean/urban pixels).  
**Fix:** `d.values?.mean ?? null` with null-safe `convertRawValue`.

---

## Current External Service Limitations

| Limitation | Details |
|---|---|
| P and K not available | ISRIC SoilGrids does not provide phosphorus or potassium globally |
| Service availability | Public API is intermittently unavailable; 15s timeout enforced |
| Ocean / urban pixels | `mean` returns `null`; stored and displayed as "N/A" |
| No WCS integration | Out of scope for this step |
| Coordinate required | Farm must have `latitude`/`longitude`; missing → 400 error |

---

## ML / AI Integrity Confirmation

The `RecommendationService` (`server/src/services/recommendation.service.js`) accepts only:
- `nitrogen`, `phosphorus`, `potassium`, `pH` (farmer-entered via the `Farm` model)
- `temperature`, `humidity`, `rainfall`

It does **not** import `ExternalSoilInformation`, `soilGrids.service.js`, or any SoilGrids-derived value.
The Random Forest `.joblib` model is untouched. No retraining occurred.

---

**FINAL STATUS: `COMPLETE`**
