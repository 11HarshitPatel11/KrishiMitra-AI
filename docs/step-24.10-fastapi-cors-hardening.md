# Step 24.10 — FastAPI CORS Hardening

## 1. Problem & Root Cause

The Step 24.5 security audit identified **GAP-14**:
In `ml-service/app/main.py`, the FastAPI crop recommendation and plant disease microservice previously configured CORS middleware with blanket wildcards:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Security Deficiencies
1. **Wildcard Origin (`allow_origins=["*"]`)**: Permits any arbitrary browser origin to read responses from the ML service via JavaScript `fetch`/`XMLHttpRequest`.
2. **Insecure Credentials Combination (`allow_credentials=True` with wildcard)**: Violates W3C CORS specifications (browsers reject wildcard origins when credentials are allowed) and creates security vulnerabilities if origins are dynamically reflected.
3. **Unrestricted Methods (`allow_methods=["*"]`)**: Permitted arbitrary HTTP methods (e.g. `PUT`, `DELETE`, `PATCH`) on a service that only serves `GET` (health/docs) and `POST` (prediction/inference).
4. **Unrestricted Headers (`allow_headers=["*"]`)**: Allowed arbitrary client request headers.

---

## 2. Architecture & Call Flow Analysis

### 2.1 Unified FastAPI Architecture
Inspection of the codebase confirmed that:
* The ML service runs as a **single unified FastAPI application** rooted at `ml-service/app/main.py`.
* Both crop recommendation (`/api/v1/predict`) and disease detection (`/api/v1/disease/predict`) are served from this same application instance. There is no separate disease microservice.

### 2.2 Client-to-Backend-to-ML Traffic Flow
* The React frontend (`client/`) communicates exclusively with the Node.js Express backend (`http://localhost:5000/api/v1`).
* The Node.js backend communicates with the FastAPI service (`http://localhost:8000`) via server-to-server HTTP calls using `axios`:
  - `server/src/services/ml.service.js` (for crop prediction)
  - `server/src/services/disease.service.js` (for disease inference)
* No browser client in the standard KrishiMitra application communicates with the FastAPI ML service directly.

### 2.3 CORS Scope & Boundaries
* **CORS is a browser-enforced security mechanism** based on the HTTP `Origin` header. It governs cross-origin requests initiated by web browsers via the Same-Origin Policy (SOP).
* **Server-to-server HTTP calls** (e.g., from Node.js Express or curl) do not send an `Origin` header. `CORSMiddleware` allows non-browser requests to pass through untouched, without injecting `Access-Control-*` headers.
* **CORS is NOT authentication**: It does not authenticate caller identities or prevent malicious non-browser clients from making HTTP requests.
* Hardening CORS on FastAPI ensures that if the ML service is ever exposed directly to browsers (or accessed via browser OpenAPI `/docs`), unauthorized cross-origin web applications cannot read ML model predictions or health statuses.

---

## 3. Implementation Details

### 3.1 Isolated CORS Configuration Module (`ml-service/app/cors_config.py`)

A dedicated configuration helper was created at `ml-service/app/cors_config.py` to encapsulate origin parsing, environment precedence, and method/header restrictions:

```python
import os

DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
ALLOWED_METHODS = ["GET", "POST", "OPTIONS"]
ALLOWED_HEADERS = ["Content-Type", "Authorization", "Accept"]

def get_allowed_origins(raw_origins: str = None, env: str = None) -> list:
    if raw_origins is None:
        raw_origins = os.getenv("ML_ALLOWED_ORIGINS")
        if raw_origins is None:
            raw_origins = os.getenv("ALLOWED_ORIGINS")

    if env is None:
        env = os.getenv("ENVIRONMENT", "development").lower()
    else:
        env = env.lower()

    if raw_origins is not None:
        cleaned = []
        for origin in raw_origins.split(","):
            trimmed = origin.strip().rstrip("/")
            if trimmed and trimmed != "*":
                cleaned.append(trimmed)
        return cleaned

    if env == "production":
        return []

    return list(DEFAULT_DEV_ORIGINS)
```

#### Key Rules Enforced:
1. **Precedence**: `ML_ALLOWED_ORIGINS` is checked first. If unset, it falls back to `ALLOWED_ORIGINS`.
2. **Wildcard Rejection**: Any standalone `*` or mixed wildcard entry (e.g., `http://localhost:3000, *`) is strictly rejected and filtered out.
3. **Normalization**: Trailing slashes are automatically stripped (`origin.rstrip("/")`), as browser `Origin` headers never include trailing slashes.
4. **Environment Defaults**:
   - `production`: Defaults to `[]` (empty list). Because the ML service is strictly internal, zero browser CORS access is permitted by default.
   - `development`: Defaults to `["http://localhost:3000", "http://127.0.0.1:3000"]`, matching the local Vite frontend port (`3000`).
5. **Restricted HTTP Methods**: Explicitly restricted to `["GET", "POST", "OPTIONS"]`.
6. **Restricted HTTP Headers**: Explicitly restricted to `["Content-Type", "Authorization", "Accept"]`.
7. **Credentials Disabled**: `allow_credentials=False` is strictly enforced.

### 3.2 Main FastAPI Application Update (`ml-service/app/main.py`)

`ml-service/app/main.py` was updated to import the configuration and configure `CORSMiddleware`:

```python
from app.cors_config import get_allowed_origins, ALLOWED_METHODS, ALLOWED_HEADERS

# ...

allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)
```

### 3.3 Environment Documentation (`ml-service/.env` & `ml-service/.env.example`)

Documented the new variable with development and production guidelines:

```env
# ------------------------------------------------------------------------------
# CORS Configuration (Step 24.10 / GAP-14 Hardening)
# ------------------------------------------------------------------------------
# Comma-separated list of allowed browser origins for cross-origin requests.
# The ML service is designed for server-to-server calls from the Node.js backend.
# Browser CORS is enforced when requests include an Origin header.
#
# Local development (default if omitted in development):
#   ML_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
#
# Production (default if omitted in production is empty [] for strict isolation):
#   ML_ALLOWED_ORIGINS=https://krishimitra.example.com
#
# Note: Wildcard (*) is strictly rejected for security.
ML_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 4. Test Strategy & Verification

### 4.1 Lightweight In-Process Testing (`ml-service/test_cors.py`)
To prevent test timeouts and sandbox socket hangs:
* The test suite directly executes `CORSMiddleware` inspection and Starlette ASGI request simulation.
* Avoids importing `app.main` or launching the FastAPI lifespan handler, which avoids loading PyTorch/torchvision weights (~6 MB) and scikit-learn models.
* Avoids multi-threaded background socket runners (`TestClient` / `anyio.start_blocking_portal()`), which can hang in isolated sandbox environments.
* Executes in **< 1 second**.

### 4.2 Test Suite Assertions (44 Total Assertions)

```
==================================================
Step 24.10 FastAPI CORS Hardening Test Suite
==================================================
Mode: Synchronous In-Process Verification (Zero Sockets / Zero ML Lifespan Overhead)

1. Source Code Inspection of app/main.py
  [PASS] Wildcard allow_origins=['*'] is completely absent from app/main.py
  [PASS] Insecure allow_credentials=True is completely absent from app/main.py
  [PASS] allow_credentials=False is explicitly configured
  [PASS] app/main.py imports and uses get_allowed_origins from app.cors_config
  [PASS] app/main.py uses ALLOWED_METHODS constant
  [PASS] app/main.py uses ALLOWED_HEADERS constant

2. Origin Parsing & Environment Precedence Logic
  [PASS] Development mode with no env var defaults to local Vite dev origins
  [PASS] Production mode with no env var defaults to empty list [] (zero browser access by default)
  [PASS] Explicit single origin parsed correctly
  [PASS] Multiple comma-separated origins parsed with whitespace trimmed
  [PASS] Trailing slashes normalized (browser Origin headers never include trailing slashes)
  [PASS] Standalone wildcard '*' is rejected and stripped
  [PASS] Mixed wildcard in 'http://localhost:3000, *' is safely stripped, preserving valid origin
  [PASS] Empty string raw_origins produces empty list []
  [PASS] Whitespace-only raw_origins produces empty list []
  [PASS] ML_ALLOWED_ORIGINS takes precedence over ALLOWED_ORIGINS
  [PASS] Explicitly empty ML_ALLOWED_ORIGINS overrides ALLOWED_ORIGINS without falling back
  [PASS] ALLOWED_METHODS strictly defines ['GET', 'POST', 'OPTIONS']
  [PASS] ALLOWED_HEADERS strictly defines ['Content-Type', 'Authorization', 'Accept']

3. Direct CORSMiddleware In-Process Evaluation
  [PASS] dev_cm: allow_all_origins is False
  [PASS] dev_cm: allow_methods does not contain wildcard '*'
  [PASS] dev_cm: allow_all_headers is False
  [PASS] dev_cm: allow_credentials is False
  [PASS] dev_cm: matches allowed origin 'http://localhost:3000'
  [PASS] dev_cm: matches allowed origin 'http://127.0.0.1:3000'
  [PASS] dev_cm: rejects unlisted origin 'http://evil-attacker.example.com'
  [PASS] OPTIONS preflight for allowed origin returns 200 OK
  [PASS] Preflight response sets exact Access-Control-Allow-Origin: http://localhost:3000
  [PASS] Preflight response does NOT return wildcard '*'
  [PASS] Preflight response does NOT allow credentials
  [PASS] Preflight response allows POST method
  [PASS] Preflight for unlisted origin does NOT include Access-Control-Allow-Origin
  [PASS] Disallowed preflight returns status 400
  [PASS] Disallowed preflight method (DELETE) returns status 400
  [PASS] Disallowed method is NOT reflected in access-control-allow-methods
  [PASS] Simple GET with allowed origin injects Access-Control-Allow-Origin: http://localhost:3000
  [PASS] Simple GET with unlisted origin does NOT inject Access-Control-Allow-Origin (browser SOP blocks read)
  [PASS] Server-to-server call without Origin header receives no CORS headers (clean passthrough)

4. Production Default Mode Isolation
  [PASS] prod_cm: allow_origins is strictly empty []
  [PASS] prod_cm: allow_all_origins is False
  [PASS] prod_cm: rejects localhost origin under production default
  [PASS] prod_cm: rejects any domain under production default
  [PASS] Production default preflight contains no Access-Control-Allow-Origin header
  [PASS] Production server-to-server traffic is unimpeded

==================================================
Results: 44 PASSED, 0 FAILED
==================================================
```

---

## 5. Regression Test Results

Running the platform test suites confirms zero regressions across existing components:

| Suite | Scope | Result |
|:---|:---|:---:|
| `ml-service/test_cors.py` | FastAPI CORS hardening, origin parsing, middleware response injection | ✅ 44 / 44 Passed |
| `client/test_rainfall_guidance.mjs` | Step 24.9 rainfall input, guidance callout, unit transparency | ✅ 37 / 37 Passed |
| `client/test_navigation.mjs` | Step 24.3 mobile navigation, accessibility, ARIA attributes | ✅ 38 / 38 Passed |
| `client/test_router.mjs` | Step 24.7 React Router navigation, route guarding | ✅ 43 / 43 Passed |
| `server/test_farm_unit.js` | Step 24.2 Farm CRUD, partial updates, 409 conflict checks | ✅ 61 / 61 Passed |
| `server/test_disease_info_unit.js` | Step 24.4 Disease profiles, safety verification, status handling | ✅ 41 / 41 Passed |
| `server/test_soilgrids_unit.js` | SoilGrids unit conversions, depth intervals, error handling | ✅ 37 / 37 Passed |

---

## 6. Production Deployment Guidance

1. **Internal Microservice Deployment**: If the ML service is deployed in an internal virtual private cloud (VPC) or container network with no public browser ingress, leave `ML_ALLOWED_ORIGINS` unset in production. `get_allowed_origins()` will return `[]`, completely disabling browser CORS access while allowing Node.js Express backend traffic unimpeded.
2. **Exposed ML Service Deployment**: If browser access to FastAPI Swagger/OpenAPI documentation (`/docs`) or direct browser inference is required in production, set `ML_ALLOWED_ORIGINS` to the exact public frontend domain:
   ```env
   ML_ALLOWED_ORIGINS=https://app.krishimitra.example.com
   ```
3. **Never Use Wildcards**: The parser will reject `*` and filter it out, but configuration should always specify exact origins without trailing slashes.
