# Step 24.17 — MongoDB Index Audit & Test Automation Report

**Project:** KrishiMitra AI (Crop Recommendation & Plant Disease Detection System)  
**Path:** `C:\Users\Harshit Patel\Desktop\Crop_Pridiction_final`  
**Execution Date:** October 24, 2026  
**Status:** Completed & Verified  

---

## 1. Executive Summary

In Step 24.17, two high-priority operational items identified in the production-readiness audit were implemented and verified:
1. **MongoDB Index Audit & Farm Index Addition:** Inspected all Mongoose schemas and confirmed that `Farm.userId` lacked an index despite frequent user-scoped queries (`Farm.find({ userId })`, `Farm.findOne({ _id, userId })`). Added an ascending, non-unique index (`farmSchema.index({ userId: 1 })`) in [server/src/models/farm.model.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/models/farm.model.js) to prevent full collection scans (`COLLSCAN`). Verified via 5 new focused assertions in `test_farm_unit.js` (66 total passed).
2. **Test Automation & Script Consolidation:** Updated [server/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/package.json) and [client/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/package.json) to consolidate all hermetic test suites under repeatable `npm test` and `npm run test:unit` commands. Clearly separated hermetic mock-based tests from external-service-dependent integration tests so default test commands never fail merely because MongoDB is offline.
3. **Environment & Fail-Fast Hardening:** Resolved child process configuration interaction in `server/src/server.js` and `server/test_env_validation.js` allowing custom `DOTENV_CONFIG_PATH` to isolate test runs from local `.env` values. Verified 50/50 passing assertions.

Total Hermetic Test Coverage: **603 Passing Assertions, 0 Failures (100% Pass Rate)** across client (155), server (404), and ML service (44).

---

## 2. MongoDB Farm Index Audit & Implementation

### 2.1 Schema & Query Audit Findings
Inspection of `server/src/models/` and `server/src/services/`:
* **User-Scoped Queries Identified:**
  - `farm.service.js`: `Farm.find({ userId }).sort({ createdAt: -1 })` (retrieves all holdings for a user).
  - `farm.service.js`: `Farm.findOne({ _id: id, userId })` (ownership validation).
  - `farm.service.js`: `Farm.findOneAndUpdate({ _id: id, userId }, ...)` (ownership-guarded mutation).
  - `farm.service.js`: `Farm.deleteOne({ _id: id, userId })` (ownership-guarded deletion).
  - `cropHistory.service.js`: `Farm.findOne({ _id: farmId, userId })`.
  - `soilInformation.service.js`: `Farm.findOne({ _id: farmId, userId })`.
  - `recommendation.service.js`: `Farm.findOne({ _id: farmId, userId })`.
* **Index Defect Identified:** Prior to Step 24.17, [farm.model.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/models/farm.model.js) declared `userId: { type: ObjectId, ref: 'User' }` but omitted an index. While single-document lookups with `{ _id, userId }` leverage the primary `_id` index, list queries (`Farm.find({ userId })`) forced MongoDB to execute a full collection scan across all users' farms.

### 2.2 Implementation
Added an explicit, non-unique index to [server/src/models/farm.model.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/models/farm.model.js):
```javascript
// Index user-scoped farm lookups (e.g. Farm.find({ userId })) to prevent collection scans
farmSchema.index({ userId: 1 });

const Farm = mongoose.model('Farm', farmSchema);
export default Farm;
```

**Index Invariants:**
* **Non-Unique:** Multiple farms may belong to the same farmer. A unique constraint was deliberately avoided to preserve multi-farm support.
* **Ascending Order:** `{ userId: 1 }` allows efficient equality matching and range scans.

### 2.3 Focused Unit Test Verification
Added Section 6 to [server/test_farm_unit.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_farm_unit.js):
* Verified that `Farm.schema.indexes()` defines `{ userId: 1 }`.
* Verified that ascending order is specified.
* Verified that the index is non-unique.
* Verified that `userId` remains strictly required and typed as Mongoose `ObjectId`.
Result: **66/66 PASSED**.

### 2.4 Production Database Migration Requirement
In production MongoDB environments where `autoIndex` is disabled for performance:
```javascript
// Execute in MongoDB Shell (mongosh) or migration script:
db.farms.createIndex({ userId: 1 }, { background: true });

// Verify index creation:
db.farms.getIndexes();
```

---

## 3. Test Automation & Script Consolidation

### 3.1 Backend Test Commands ([server/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/package.json))

| Command | Target Scope | Hermetic? | Dependencies | Test Count |
| :--- | :--- | :---: | :--- | :---: |
| `npm test` | All backend unit suites | **Yes** | Node.js only | 404 |
| `npm run test:unit` | All backend unit suites | **Yes** | Node.js only | 404 |
| `npm run test:farm` | Farm CRUD, indexes, cascade | **Yes** | Node.js only | 66 |
| `npm run test:disease` | Disease KB, citations, schema | **Yes** | Node.js only | 41 |
| `npm run test:soil` | SoilGrids bounds, unit conversion | **Yes** | Node.js only | 37 |
| `npm run test:env` | Startup env fail-fast validation | **Yes** | Node.js only | 50 |
| `npm run test:auth` | User profile CRUD & auth | **Yes** | Node.js only | 69 |
| `npm run test:market` | Mandi normalization & aliases | **Yes** | Node.js only | 106 |
| `npm run test:rate-limit` | Auth IP rate limiting & 429 | **Yes** | Node.js only | 35 |
| `npm run test:integration` | Express HTTP stack integration | **No** | Requires MongoDB on 27017 | 62 |
| `npm run test:all` | Unit + Integration suites | Mixed | Requires MongoDB on 27017 | 466 |

### 3.2 Client Test Commands ([client/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/package.json))

| Command | Target Scope | Hermetic? | Dependencies | Test Count |
| :--- | :--- | :---: | :--- | :---: |
| `npm test` | All client unit suites | **Yes** | Node.js only | 155 |
| `npm run test:unit` | All client unit suites | **Yes** | Node.js only | 155 |
| `npm run test:api` | API Base URL centralization | **Yes** | Node.js only | 37 |
| `npm run test:rainfall` | Rainfall input guidance & UI | **Yes** | Node.js only | 37 |
| `npm run test:nav` | Mobile responsive navigation | **Yes** | Node.js only | 38 |
| `npm run test:router` | React Router v7 & ProtectedRoute | **Yes** | Node.js only | 43 |
| `npm run build` | Vite production bundle build | **Yes** | Node.js only | Pass (6.6s) |

### 3.3 ML Microservice Test Commands (`ml-service/`)

| Command | Target Scope | Hermetic? | Dependencies | Test Count |
| :--- | :--- | :---: | :--- | :---: |
| `venv\Scripts\python.exe test_cors.py` | FastAPI CORS origin gating | **Yes** | Python virtualenv | 44 |

---

## 4. Verification Evidence & Test Execution

### 4.1 Server Unit Test Suite Execution
* **Command:** `cd server; npm run test:unit`
* **Exit Code:** `0`
* **Results:**
  - `test_farm_unit.js`: 66 passed, 0 failed
  - `test_disease_info_unit.js`: 41 passed, 0 failed
  - `test_soilgrids_unit.js`: 37 passed, 0 failed
  - `test_env_validation.js`: 50 passed, 0 failed
  - `test_auth_profile_unit.js`: 69 passed, 0 failed
  - `test_market_normalization_unit.js`: 106 passed, 0 failed
  - `test_rate_limiter_unit.js`: 35 passed, 0 failed
  - **Subtotal:** **404 PASSED, 0 FAILED**

### 4.2 Client Unit Test Suite Execution
* **Command:** `cd client; npm run test:unit`
* **Exit Code:** `0`
* **Results:**
  - `test_api_config.mjs`: 37 passed, 0 failed
  - `test_rainfall_guidance.mjs`: 37 passed, 0 failed
  - `test_navigation.mjs`: 38 passed, 0 failed
  - `test_router.mjs`: 43 passed, 0 failed
  - **Subtotal:** **155 PASSED, 0 FAILED**

### 4.3 ML Service Test Execution
* **Command:** `& "ml-service\venv\Scripts\python.exe" ml-service/test_cors.py`
* **Exit Code:** `0`
* **Results:**
  - `test_cors.py`: **44 PASSED, 0 FAILED**

### 4.4 Backend Integration Test Execution
* **Command:** `cd server; npm run test:integration`
* **Exit Code:** `1` (Expected when MongoDB is offline)
* **Status:** **`BLOCKED`**
* **Reason:** MongoDB daemon is not running on `127.0.0.1:27017`. In sandbox mode without a running database, live HTTP database integration tests cannot run. This validates that hermetic unit tests (`npm test`) remain isolated from service availability.

---

## 5. Files Changed

| File Path | Modification Summary |
| :--- | :--- |
| [server/src/models/farm.model.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/models/farm.model.js) | Added `farmSchema.index({ userId: 1 })` to optimize user farm queries. |
| [server/test_farm_unit.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_farm_unit.js) | Added Section 6 verifying index existence, ascending order, non-uniqueness, and schema validation (66 total tests). |
| [server/src/server.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/src/server.js) | Added support for `DOTENV_CONFIG_PATH` to isolate test subprocesses from local `.env`. |
| [server/test_env_validation.js](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/test_env_validation.js) | Configured isolated `DOTENV_CONFIG_PATH` and 15s timeout for fail-fast child process test (50 total tests). |
| [server/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/server/package.json) | Updated `test`, `test:unit`, `test:all`, and added granular test scripts for all 7 unit suites. |
| [client/package.json](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/client/package.json) | Updated `test`, `test:unit`, and added granular test scripts for all 4 client suites. |
| [README.md](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/README.md) | Synchronized Section 8 test commands, updated test counts, and documented production MongoDB index migration. |
| [docs/step-24.15-final-production-readiness-audit.md](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.15-final-production-readiness-audit.md) | Updated items 4 and 5 from OPEN to RESOLVED in Step 24.17. |
| [docs/step-24.17-mongodb-index-audit-and-test-automation.md](file:///C:/Users/Harshit%20Patel/Desktop/Crop_Pridiction_final/docs/step-24.17-mongodb-index-audit-and-test-automation.md) | Created this report. |

---

## 6. Remaining Considerations
* **Clustered Rate Limiting (Redis):** Remains open for multi-container scaled deployments.
* **Third-Party API Caching:** Data.gov.in and Open-Meteo caching layers remain recommended before public launch.
* **Production Database Performance Benchmarking:** While the index avoids collection scans structurally, live latency improvements should be benchmarked under simulated multi-user load once MongoDB is running.
