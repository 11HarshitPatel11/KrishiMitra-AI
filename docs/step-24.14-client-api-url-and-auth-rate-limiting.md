# Step 24.14 — Client API URL Configuration + Authentication Rate Limiting

**Project**: KrishiMitra AI — AI-Based Crop Recommendation System  
**Workspace Path**: `C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final`  
**Date**: October 2026  
**Status**: `COMPLETED & FULLY VERIFIED` (72/72 New Tests Passed; 0 Regressions)

---

## 1. Executive Summary & Objectives

Step 24.14 remediates the final two open gaps identified in the [Step 24.11 Fresh SRS Compliance Audit](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.11-fresh-srs-compliance-audit.md):

1. **GAP-16 (`UI-06`) — Client Hardcoded API URLs**:
   All 9 frontend service modules in `client/src` previously hardcoded `http://localhost:5000/api/v1`. This prevented the frontend from being built or deployed to staging or production without manual search-and-replace.
2. **GAP-17 (`SEC-06`) — Missing Authentication Rate Limiting**:
   The backend routes `POST /api/v1/auth/login` and `POST /api/v1/auth/register` were susceptible to automated brute-force password guessing and high-volume registration flooding.

### Key Constraints & Invariants
* **Zero Disruption to Existing Contracts**: All existing API routes, request bodies, response formats, and JWT authorization headers remain 100% backward compatible.
* **Security & Secret Secrecy**: Vite environment variables prefixed with `VITE_` are publicly embedded in client-side bundles; no backend credentials, DB strings, or JWT secrets are placed in client `.env` files.
* **Safe IP Resolution**: Rate limiting resolves client identity via Express `req.ip` without blindly trusting spoofable `X-Forwarded-For` headers.
* **Cluster Transparency**: In-memory rate limiting is documented as single-process; multi-replica deployments require distributed Redis backing.

---

## 2. Architecture & Implementation

### 2.1 Centralized Frontend API Configuration ([`api.config.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/config/api.config.js))

Created a shared module `client/src/config/api.config.js` exporting:
* `getApiBaseUrl()`: Evaluates `import.meta.env.VITE_API_URL` (browser) and `process.env.VITE_API_URL` (Node / test runner).
* **Trailing Slash Defense**: Normalizes URLs by trimming whitespace and stripping trailing slashes (e.g. `https://api.example.com/api/v1/` → `https://api.example.com/api/v1`).
* **Safe Development Fallback**: If unset or empty, safely defaults to `'http://localhost:5000/api/v1'`.

#### Services Migrated (100% of Client Services):
1. [`client/src/services/auth.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/services/auth.service.js): Uses `${API_BASE_URL}/auth`
2. [`client/src/features/farm/services/farm.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/farm/services/farm.service.js): Uses `${API_BASE_URL}/farms`
3. [`client/src/features/cropHistory/services/cropHistory.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/cropHistory/services/cropHistory.service.js): Uses `${API_BASE_URL}/crop-history`
4. [`client/src/features/disease/services/disease.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/disease/services/disease.service.js): Uses `${API_BASE_URL}/disease`
5. [`client/src/features/market/services/market.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/market/services/market.service.js): Replaced ad-hoc `determineBaseUrl()` with `${API_BASE_URL}/market`
6. [`client/src/features/recommendation/services/recommendation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/services/recommendation.service.js): Uses `${API_BASE_URL}/recommendations/predict`
7. [`client/src/features/soil/services/soilInformation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/soil/services/soilInformation.service.js): Uses `${API_BASE_URL}/soil-information` and `${API_BASE_URL}/farms`
8. [`client/src/features/soil/services/externalSoil.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/soil/services/externalSoil.service.js): Uses `${API_BASE_URL}/soil-information/external`
9. [`client/src/features/weather/services/weather.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/weather/services/weather.service.js): Uses `${API_BASE_URL}/weather/current`

#### Client Configuration Example ([`client/.env.example`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/.env.example))
Created `client/.env.example` documenting `VITE_API_URL` with prominent security warnings clarifying that all `VITE_` variables are public in browser bundles.

---

### 2.2 Authentication Rate Limiting ([`rateLimiter.middleware.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/middlewares/rateLimiter.middleware.js))

Implemented zero-dependency sliding-window in-memory rate limiting:
* **Configuration Defaults**:
  * Window: 15 minutes (`900,000 ms`), configurable via `AUTH_RATE_LIMIT_WINDOW_MS`.
  * Limit: 10 attempts per IP per window, configurable via `AUTH_RATE_LIMIT_MAX`.
* **Targeted Application** ([`auth.routes.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/routes/auth.routes.js)):
  * Applied strictly to `POST /register` and `POST /login`.
  * Excluded from authenticated profile endpoints (`GET /me`, `PATCH /profile`) to prevent normal browsing from consuming login quota.
* **Standard HTTP 429 Response**:
  ```json
  {
    "success": false,
    "message": "Too many authentication attempts. Please try again later. (Retry after 900 seconds)",
    "retryAfter": 900
  }
  ```
* **Standard Headers Emitted**:
  * `Retry-After`: Seconds until quota resets.
  * `RateLimit-Limit` & `X-RateLimit-Limit`: Maximum requests allowed.
  * `RateLimit-Remaining` & `X-RateLimit-Remaining`: Remaining request quota.
  * `RateLimit-Reset` & `X-RateLimit-Reset`: Unix epoch reset timestamp.
* **Memory Management**: Unreferenced interval timer automatically purges expired client buckets to guarantee bounded heap memory over long uptime.
* **Security & Secrecy**: No request body parameters (passwords, emails, tokens) are ever accessed or logged.

---

## 3. Test Evidence & Results

### 3.1 Step 24.14 Test Suites (72 Passed, 0 Failed)

1. **Client API URL Configuration** ([`client/test_api_config.mjs`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/test_api_config.mjs)):
   * **Execution**: `node client/test_api_config.mjs`
   * **Result**: **37 PASSED, 0 FAILED**
   * Verified: Default fallback, custom `VITE_API_URL`, trailing slash stripping, whitespace trimming, all 9 service migrations, 0 remaining hardcoded `localhost:5000` strings, `.env.example` security documentation.

2. **Authentication Rate Limiting** ([`server/test_rate_limiter_unit.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_rate_limiter_unit.js)):
   * **Execution**: `node server/test_rate_limiter_unit.js`
   * **Result**: **35 PASSED, 0 FAILED**
   * Verified: Under-limit requests call `next()`, headers decrement correctly, over-limit requests return HTTP 429 with `Retry-After`, multi-tenant IP isolation, window expiration/reset, custom configuration options, mounting on `/login` and `/register`, zero credential logging.

### 3.2 Full Regression Suite & Production Build

| Test Suite | Scope | Assertions | Status |
|:---|:---|:---:|:---:|
| `server/test_rate_limiter_unit.js` | Auth sliding-window rate limiting & HTTP 429 | 35 | ✅ 35 Passed |
| `server/test_market_normalization_unit.js` | Commodity reverse-mapping & geo fallback | 106 | ✅ 106 Passed |
| `server/test_auth_profile_unit.js` | User Profile API & header branding | 69 | ✅ 69 Passed |
| `server/test_farm_unit.js` | Farm CRUD, IDOR, cascades | 61 | ✅ 61 Passed |
| `server/test_disease_info_unit.js` | 26 plant pathology classes, safety rules | 41 | ✅ 41 Passed |
| `server/test_soilgrids_unit.js` | SoilGrids v2.0 conversion, 15s timeout | 37 | ✅ 37 Passed |
| `client/test_api_config.mjs` | Client API URL centralization & .env.example | 37 | ✅ 37 Passed |
| `client/test_rainfall_guidance.mjs` | Rainfall input & transparency callout | 37 | ✅ 37 Passed |
| `client/test_navigation.mjs` | Mobile navigation & ARIA attributes | 38 | ✅ 38 Passed |
| `client/test_router.mjs` | React Router v7 routes & protection | 43 | ✅ 43 Passed |
| `client npm run build` | Frontend Vite production bundle | — | ✅ Built in 9.54s |
| **Total Automated Assertions** | **Hermetic Unit & Integration Tests** | **504** | **✅ 504 Passed, 0 Failed** |

---

## 4. Modified & Created Files

1. [`client/src/config/api.config.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/config/api.config.js) *(Created)*
2. [`client/.env.example`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/.env.example) *(Created)*
3. [`client/src/services/auth.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/services/auth.service.js) *(Updated)*
4. [`client/src/features/farm/services/farm.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/farm/services/farm.service.js) *(Updated)*
5. [`client/src/features/cropHistory/services/cropHistory.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/cropHistory/services/cropHistory.service.js) *(Updated)*
6. [`client/src/features/disease/services/disease.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/disease/services/disease.service.js) *(Updated)*
7. [`client/src/features/market/services/market.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/market/services/market.service.js) *(Updated)*
8. [`client/src/features/recommendation/services/recommendation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/recommendation/services/recommendation.service.js) *(Updated)*
9. [`client/src/features/soil/services/soilInformation.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/soil/services/soilInformation.service.js) *(Updated)*
10. [`client/src/features/soil/services/externalSoil.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/soil/services/externalSoil.service.js) *(Updated)*
11. [`client/src/features/weather/services/weather.service.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/src/features/weather/services/weather.service.js) *(Updated)*
12. [`server/src/middlewares/rateLimiter.middleware.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/middlewares/rateLimiter.middleware.js) *(Created)*
13. [`server/src/routes/auth.routes.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/routes/auth.routes.js) *(Updated)*
14. [`server/.env.example`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/.env.example) *(Updated)*
15. [`client/test_api_config.mjs`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/test_api_config.mjs) *(Created)*
16. [`server/test_rate_limiter_unit.js`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_rate_limiter_unit.js) *(Created)*
17. [`docs/step-24.11-fresh-srs-compliance-audit.md`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.11-fresh-srs-compliance-audit.md) *(Updated)*
18. [`docs/step-24.14-client-api-url-and-auth-rate-limiting.md`](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.14-client-api-url-and-auth-rate-limiting.md) *(Created)*
