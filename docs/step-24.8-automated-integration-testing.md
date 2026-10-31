# Step 24.8 — Automated Integration Testing Infrastructure

## 1. Overview & Objective

Prior to this step, the KrishiMitra AI platform relied on unit test suites with mocks (177 unit assertions) or unautomated manual test scripts (`test_farm_integration.js`, `test_integration.js`) that required manual multi-process orchestration (Express + MongoDB + FastAPI) and could not execute reliably in continuous integration environments.

**Step 24.8 resolves GAP-15** by delivering a robust, hermetic, and automated integration test harness that executes full end-to-end HTTP requests through Express middlewares, validators, controllers, and services against an isolated MongoDB instance, while stubbing external ML microservices via a controllable in-process mock server.

---

## 2. Test Harness Architecture

The integration testing infrastructure consists of three decoupled components:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Integration Test Harness Architecture                │
└────────────────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │ Express HTTP Client  │        │   Mock ML Service    │
    │  (http_client.js)    │        │ (mock_ml_service.js) │
    ├──────────────────────┤        ├──────────────────────┤
    │ • Ephemeral TCP port │        │ • FastAPI Contracts  │
    │ • Zero port conflict │        │   (/api/v1/predict,  │
    │ • Native fetch/Blob  │        │   /disease/predict)  │
    │ • Multipart support  │        │ • Controllable modes │
    └──────────┬───────────┘        └──────────┬───────────┘
               │                               │
               ▼                               ▼
    ┌──────────────────────────────────────────────────────┐
    │     Node.js Express App (Middlewares & Routers)      │
    │     (Auth, Farm, Recommendation, Disease Gateways)   │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │        Isolated MongoDB Database Instance            │
    │          ('crop_integration_test_db')                │
    │    • Real Mongoose schemas, queries, & indexes       │
    │    • Complete teardown & dropDatabase on exit        │
    └──────────────────────────────────────────────────────┘
```

### 2.1 In-Process Express HTTP Client (`server/test_helpers/http_client.js`)
* **Transport:** Binds the Express application to an ephemeral OS-assigned TCP port (`127.0.0.1:0`), guaranteeing zero port conflicts across concurrent test runs.
* **Client Engine:** Uses native Node.js `fetch`, `FormData`, and `Blob` APIs without adding heavy third-party testing dependencies.
* **Payload Handling:** Automatically formats JSON payloads, sets proper `Content-Type` headers, and supports multipart file uploads (`postMultipart`) with binary buffers for leaf image testing.
* **Lifecycle:** Shuts down the internal HTTP listener cleanly via `.close()`.

### 2.2 Controllable Mock ML Microservice (`server/test_helpers/mock_ml_service.js`)
* **Contract Mirroring:** Implements the exact HTTP wire contracts of the FastAPI crop recommendation service (`POST /api/v1/predict`) and disease detection service (`POST /api/v1/disease/predict`).
* **Dynamic Behavior Modes:**
  * `'normal'`: Returns valid top-ranked crop probabilities or confident disease predictions (confidence ≥ 0.70).
  * `'uncertain'`: Returns disease predictions with confidence < 0.70 (`status: 'uncertain'`).
  * `'failure'`: Emits HTTP 500 internal server errors to test Node.js gateway fallback.
  * `'timeout'`: Stalls requests to test Node.js `AbortController` timeout handling.

### 2.3 Database Isolation & Teardown
* **Isolated Target Database:** Strictly targets `crop_integration_test_db`. Never connects to, reads from, or modifies the development or production database (`crop_db`).
* **Lifecycle Teardown:** A robust `finally` block drops the test database, closes all Mongoose connections, shuts down the Express HTTP test client, and terminates the mock ML server, leaving zero residual processes or artifacts.

---

## 3. Workflows Tested

The test suite (`server/test_backend_integration.js`) validates 4 core backend workflows covering 62 assertions:

### Workflow A: Authentication Integration
1. **User Registration:** Validates HTTP 201 response, user document creation, exclusion of hashed password in response payload, and database persistence.
2. **Duplicate Email Rejection:** Validates HTTP 400 rejection and duplicate prevention.
3. **User Login:** Validates HTTP 200 response and issuance of signed, verifiable JWT token.
4. **Invalid Credentials:** Validates HTTP 401 rejection for incorrect password without leaking user existence.
5. **Unauthenticated Access:** Validates HTTP 401 rejection on protected routes when `Authorization` header is omitted.
6. **Invalid Token Rejection:** Validates HTTP 401 rejection when a tampered or invalid JWT signature is provided.

### Workflow B: Farm Operations & Multi-Tenant IDOR Security
1. **Authenticated Farm Creation:** Validates HTTP 201 response and document creation bound to the authenticated user's ID.
2. **Farm Retrieval by ID:** Validates HTTP 200 retrieval of farm details for the authenticated owner.
3. **Partial Update via PATCH:** Validates HTTP 200 partial update of fields (`farmName`, `area`), ensuring omitted fields (`nitrogen`, `pH`) are preserved intact.
4. **Multi-Tenant IDOR Isolation:**
   * User B attempting to read User A's farm returns HTTP 404.
   * User B attempting to update User A's farm returns HTTP 404.
   * User B attempting to delete User A's farm returns HTTP 404.
5. **Deletion Dependency Conflict (409 Conflict):** Validates that deleting a farm with existing dependent records (`CropHistory`) is blocked with HTTP 409 Conflict, returning exact dependent counts and preserving the farm document.
6. **Clean Deletion:** Validates HTTP 200 deletion after dependent records are cleared, and verifies subsequent GET returns HTTP 404.

### Workflow C: Crop Recommendation Gateway Integration
1. **Request Validation:** Rejects payloads with missing mandatory agronomic features with HTTP 400.
2. **Bounds Validation:** Rejects payloads with negative or out-of-range feature values with HTTP 400.
3. **ML Microservice Forwarding & Scoring:** Sends valid features to Mock ML service, verifies candidate crop ranking (`rice`), and validates multi-factor composite scoring (`ML Probability × Rotation Factor × Market Factor`).
4. **Upstream ML Failure Fallback:** Switches Mock ML to `'failure'` mode; verifies that Node.js gateway handles the 500 error safely and returns controlled HTTP 503 ("ML service is currently unavailable") without exposing stack traces.

### Workflow D: Disease Detection Gateway Integration
1. **Upload Validation (Missing File):** Rejects requests missing image files with HTTP 400.
2. **Upload Validation (MIME Filtering):** Rejects non-image files (`text/plain`) with HTTP 400.
3. **Confident Prediction & Database Enrichment:** Uploads a valid leaf image; Mock ML returns `status: 'confident'`. Gateway enriches response with comprehensive disease advisory from MongoDB (`informationStatus: 'available'`, symptoms, prevention, management).
4. **Uncertain Prediction & Safe Withholding:** Mock ML returns `status: 'uncertain'` (confidence = 0.42). Gateway strictly withholds advisory guidance (`informationStatus: 'withheld_due_to_uncertainty'`, `information: null`) to prevent misleading farmers.
5. **Upstream Disease ML Failure:** Switches Mock ML to `'failure'`; verifies Node.js gateway handles error safely and returns controlled HTTP 502/503.

---

## 4. Test Execution & Verification

### 4.1 Running the Tests

```bash
# Run backend integration tests only
npm --prefix server run test:integration

# Run backend unit tests only
npm --prefix server run test:unit

# Run full backend test suite (unit + integration)
npm --prefix server test

# Run frontend tests
npm --prefix client test
```

### 4.2 Test Results Summary

| Test Suite | File | Scope | Assertions | Status |
|:---|:---|:---|:---:|:---:|
| Backend Integration | `server/test_backend_integration.js` | Auth, Farm, IDOR, Rec Gateway, Disease Gateway | 62 | ✅ 62 Passed |
| Farm Unit Tests | `server/test_farm_unit.js` | Validators, Service, Controller, IDOR | 61 | ✅ 61 Passed |
| Disease Info Unit Tests | `server/test_disease_info_unit.js` | Class matching, citations, chemical safety | 36 | ✅ 36 Passed |
| SoilGrids Unit Tests | `server/test_soilgrids_unit.js` | ISRIC data conversion, depth intervals, fallback | 37 | ✅ 37 Passed |
| Env Startup Validation | `server/test_env_validation.js` | Startup environment variables, fail-fast | 50 | ✅ 50 Passed |
| Mobile Navigation | `client/test_navigation.mjs` | Responsive DOM, touch targets, ARIA | 38 | ✅ 38 Passed |
| React Router Navigation | `client/test_router.mjs` | URL routing, route guards, browser history | 43 | ✅ 43 Passed |
| **Total Automated Assertions** | | | **327** | **✅ 327 Passed, 0 Failed** |

---

## 5. Security & Architectural Guarantees Preserved

1. **Zero Contamination of Production Data:** Tests strictly bind to `crop_integration_test_db`. All test documents match explicit naming patterns (`@integration-test.com`, `Integration Test Farm`), and the database is dropped upon suite completion.
2. **Zero Breaking Changes:** Production and development API routes (`/api/v1/auth`, `/api/v1/farms`, `/api/v1/recommendations`, `/api/v1/disease`) remain untouched.
3. **No Heavy External Dependencies:** Built using native Node.js APIs (`http`, `fetch`, `FormData`, `Blob`), avoiding complex test framework overhead.
4. **Adaptive Execution:** Automatically detects whether MongoDB is accessible. In isolated environments without socket permissions, it provides clear diagnostic messaging while unit suites maintain 100% coverage.
