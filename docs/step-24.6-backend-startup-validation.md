# Step 24.6 — Backend Startup Environment Validation

## 1. Overview & Context

In the Step 24.5 platform audit, **GAP-13** was classified as a **Priority 1 (P1)** architectural gap:
> *"No server startup environment variable validation script. If `JWT_SECRET`, `MONGODB_URI`, or `ML_SERVICE_URL` is omitted, the application starts but crashes on the first auth attempt or fails silently."*

Prior to this step, `server/src/server.js` initiated execution without asserting that required environment variables existed or satisfied physical structural constraints. If `JWT_SECRET` was omitted, the server would bind to its port and accept traffic, only to crash ungracefully with `Error: secretOrPrivateKey must have a value` when a farmer submitted a login or registration form.

Step 24.6 completely eliminates this vulnerability by implementing a robust, maintainable, fail-fast startup validation module (`server/src/config/env.js`) with zero secret leakage.

---

## 2. Root Cause Analysis

An inspection of `server/src/server.js` and dependent modules revealed three specific structural weaknesses:

1. **Absence of Boot Gatekeeping:**
   `server.js` immediately invoked `mongoose.connect(process.env.MONGODB_URI)` and `app.listen(PORT)` without checking if `process.env.MONGODB_URI` was defined. If omitted, Mongoose would fail at runtime.
2. **Delayed Authentication Failures:**
   `server/src/services/auth.service.js` directly passed `process.env.JWT_SECRET` to `jwt.sign()`. When undefined or empty, `jsonwebtoken` threw an uncaught error at runtime during registration or login.
3. **Decoupled Microservice Configuration:**
   Both `ml.service.js` and `disease.service.js` communicate with the Python FastAPI microservice. While fallback local URLs (`http://localhost:8000`) were hardcoded deep inside individual service files, missing deployment configurations in production could lead to silent misdirection or unexpected failure modes.
4. **Secret Exposure Risk:**
   Without a dedicated validator, ad-hoc validation or stack traces during misconfiguration risked leaking portions of secrets or connection strings to logs.

---

## 3. Implementation Architecture

### 3.1 Validation Engine (`server/src/config/env.js`)

A dedicated configuration validator was created in `server/src/config/env.js`. It exports two complementary functions:

1. **`validateEnv(env = process.env)`:**
   A pure validation function that checks an environment dictionary against physical rules. It returns `{ isValid: boolean, errors: string[], warnings: string[] }` without terminating the process, enabling comprehensive unit testing.
2. **`validateStartupEnv(env = process.env, options = {})`:**
   The startup enforcement function. If validation fails, it formats a structured fatal error banner to `console.error` and terminates the Node.js process with `process.exit(1)`.

### 3.2 Environment Variable Rules Matrix

| Variable | Requirement Level | Constraints / Rules | Purpose & Fallback Behavior |
|:---|:---:|:---|:---|
| `JWT_SECRET` | **REQUIRED** | Non-empty string, trimmed length ≥ 8 characters. Must not be whitespace. | Used for signing and verifying all farmer authentication tokens. Fails fast if missing. |
| `MONGODB_URI` | **REQUIRED** | Non-empty string, must start with `mongodb://` or `mongodb+srv://`. | Primary database connection string. Fails fast if missing or invalid protocol. |
| `ML_SERVICE_URL` | **REQUIRED** | Non-empty string, must be a parseable URL using `http:` or `https:`. | Base endpoint for Crop Recommendation and Disease Detection FastAPI microservices. Fails fast if missing or malformed. |
| `PORT` | Optional | If provided, must be an integer between 1 and 65535. | Backend HTTP listener port. Defaults to `5000` in `server.js`. |
| `NODE_ENV` | Optional | If provided, recommended values: `development`, `production`, `test`. | Sets application execution mode. Defaults to `development`. |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of allowed browser origins. | Express CORS whitelist. Defaults to `http://localhost:3000` in `app.js`. |
| `JWT_EXPIRES_IN` | Optional | String time format (e.g., `'7d'`, `'24h'`). | Token validity window. Defaults to `'7d'` in `auth.service.js`. |
| `WEATHER_API_BASE_URL` | Optional | Valid HTTP(S) URL. | Open-Meteo endpoint. Has code-level fallback in `weather.service.js`. |
| `MARKET_API_BASE_URL` | Optional | Valid HTTP(S) URL. | Data.gov.in OGD endpoint. Has code-level fallback in `market.service.js`. |
| `MARKET_API_KEY` | Optional | String API key. | When omitted, market service operates in graceful fallback mode. |

### 3.3 Security Invariants

* **Strict Redaction:** Error messages explicitly name the invalid or missing variable (e.g. `JWT_SECRET cannot be empty or whitespace`, `JWT_SECRET must be at least 8 characters long for security`), but **never** reflect or concatenate the actual secret string or substring.
* **Fail-Fast Boundary:** `validateStartupEnv()` executes synchronously at the top level of `server.js` before `mongoose.connect()` is called and before `app.listen(PORT)` is invoked. If validation fails, zero network ports are bound.

---

## 4. Files Changed

1. **`server/src/config/env.js` (NEW):**
   * Implements `validateEnv()` and `validateStartupEnv()`.
   * Enforces presence, whitespace, protocol, and format rules.
   * Redacts secret values from all logs and error strings.
2. **`server/src/server.js` (MODIFIED):**
   * Placed `dotenv.config()` at the top of the file.
   * Invokes `validateStartupEnv()` immediately, guaranteeing process termination before `mongoose.connect()` or `app.listen()`.
3. **`server/.env.example` (UPDATED):**
   * Added clear documentation dividing variables into **REQUIRED AT STARTUP** and **OPTIONAL (With Defaults)**.
   * Updated `JWT_SECRET` guidance (`your_jwt_secret_key_here_min_8_chars`).
   * Maintained strict credential-free documentation.
4. **`server/package.json` (MODIFIED):**
   * Added `"test:env": "node test_env_validation.js"` script.
5. **`server/test_env_validation.js` (NEW):**
   * Comprehensive 50-assertion test suite verifying missing, empty, whitespace-only, malformed, and valid configurations, secret non-leakage, and child process abort behavior.
6. **`docs/step-24.6-backend-startup-validation.md` (NEW):**
   * This completion and architectural documentation.

---

## 5. Automated Tests and Verification Results

### 5.1 Step 24.6 Environment Validation Suite (`npm --prefix server run test:env`)

Executing `test_env_validation.js` runs 50 automated assertions covering 7 categories:

```text
==================================================
Step 24.6 Backend Startup Environment Validation Suite
==================================================

1. JWT_SECRET Validation
  ✅  Rejects missing JWT_SECRET
  ✅  Error specifies JWT_SECRET is missing
  ✅  Rejects undefined JWT_SECRET
  ✅  Rejects empty string JWT_SECRET
  ✅  Error specifies empty/whitespace rule
  ✅  Rejects whitespace-only JWT_SECRET
  ✅  Error specifies whitespace rejection
  ✅  Rejects short JWT_SECRET (< 8 characters)
  ✅  Error specifies minimum 8 characters rule
  ✅  Accepts valid JWT_SECRET

2. MONGODB_URI Validation
  ✅  Rejects missing MONGODB_URI
  ✅  Error specifies MONGODB_URI is missing
  ✅  Rejects empty string MONGODB_URI
  ✅  Error specifies empty/whitespace rule
  ✅  Rejects whitespace-only MONGODB_URI
  ✅  Rejects MONGODB_URI with non-mongo protocol
  ✅  Error specifies required protocols
  ✅  Accepts standard mongodb:// connection string
  ✅  Accepts mongodb+srv:// connection string

3. ML_SERVICE_URL Validation
  ✅  Rejects missing ML_SERVICE_URL
  ✅  Error specifies ML_SERVICE_URL is missing
  ✅  Rejects empty string ML_SERVICE_URL
  ✅  Error specifies empty/whitespace rule
  ✅  Rejects whitespace-only ML_SERVICE_URL
  ✅  Rejects malformed non-URL string
  ✅  Error specifies valid URL rule
  ✅  Rejects unsupported protocol in ML_SERVICE_URL
  ✅  Error specifies http/https requirement
  ✅  Accepts valid http:// URL
  ✅  Accepts valid https:// URL

4. Optional PORT Validation
  ✅  Accepts valid integer PORT (8080)
  ✅  Rejects non-numeric PORT
  ✅  Error specifies port range rule
  ✅  Rejects out-of-range high PORT
  ✅  Rejects PORT 0
  ✅  Rejects floating point PORT
  ✅  Accepts omitted PORT (defaults in server.js)

5. Complete Valid Configuration
  ✅  Full baseline configuration is valid
  ✅  No errors reported on valid configuration

6. Secret Leak Prevention in Error Messages
  ✅  Sensitive secret value is never printed in error messages
  ✅  Even invalid short secret value is not reflected in error messages
  ✅  Logger output never leaks secret value
  ✅  Logger output never reflects secret substring
  ✅  Logger includes clear fatal message header

7. Fail-Fast Process Execution (Process Abort Before Listening)
  ✅  Process exited with non-zero exit code (1)
  ✅  Exit code is exactly 1 on validation error
  ✅  Fatal error banner emitted before exit
  ✅  Specific error for JWT_SECRET emitted
  ✅  Server NEVER started listening on port
  ✅  MongoDB connection was NEVER attempted

==================================================
Results: 50 PASSED, 0 FAILED
==================================================
```

### 5.2 Full Platform Regression Verification

All existing unit and build test suites were re-executed to verify zero regression across the platform:

| Test Suite / Build Target | Command | Result |
|:---|:---|:---:|
| **Startup Environment Validation** | `npm --prefix server run test:env` | ✅ **50 Passed, 0 Failed** |
| **Disease Information Coverage** | `npm --prefix server run test:disease` | ✅ **41 Passed, 0 Failed** |
| **Farm Management CRUD & Security** | `npm --prefix server run test:farm` | ✅ **61 Passed, 0 Failed** |
| **SoilGrids Conversions & Resiliency** | `node server/test_soilgrids_unit.js` | ✅ **37 Passed, 0 Failed** |
| **Mobile Navigation & Accessibility** | `npm --prefix client run test:nav` | ✅ **38 Passed, 0 Failed** |
| **Frontend Production Build** | `npm --prefix client run build` | ✅ **57 modules transformed in 1.85s, 0 errors** |
| **Total Automated Assertions** | | **227 PASSED, 0 FAILED** |

---

## 6. Remaining Limitations

1. **Static vs. Live Service Ping:**
   `validateEnv` validates the syntactic and semantic structure of `MONGODB_URI` and `ML_SERVICE_URL` (format, scheme, protocols). It does not perform active network probes or live TCP pings during startup. This is by design: requiring active network reachability on boot can lead to boot loops or race conditions during multi-container startup (e.g. Docker Compose or Kubernetes pod initialization). Runtime service availability remains handled by existing timeout and 503 fallback mechanisms in `ml.service.js` and `disease.service.js`.
2. **Optional External APIs:**
   `MARKET_API_KEY` and `WEATHER_API_BASE_URL` are not enforced as blocking startup requirements, preserving offline development and graceful degradation when government or third-party weather APIs are unavailable.
