# STEP 24.30 — Authentication Rate Limiting Diagnosis and Remediation Report

**Project:** KrishiMitra AI  
**Date:** 2026-10-25  
**Environment:** Local Development Demo  
**Frontend:** [http://localhost:3000](http://localhost:3000)  
**Backend:** [http://localhost:5000](http://localhost:5000)  
**Database:** Local MongoDB — `crop_db` (`mongodb://localhost:27017/crop_db`)  

---

## 1. Executive Summary

During local demonstration and browser testing of KrishiMitra AI, user registration surfaced an HTTP 429 rate-limit error message (`Too many authentication attempts. Please try again later. (Retry after X seconds)`), and user login became inaccessible.

An exhaustive audit of the Express backend routes, controllers, middleware, environment configurations, and frontend service code was performed. The exact root causes were identified, safely remediated, and verified across both automated unit suites and live service probes.

### Summary of Outcomes:
* **Route Partitioning Implemented:** Registration (`POST /api/v1/auth/register`) and Login (`POST /api/v1/auth/login`) now have isolated sliding-window quota buckets. Unrelated or failed login attempts cannot lock out user registrations, and registering an account does not deplete the login allowance.
* **Environment-Specific Configuration:** Development mode (`NODE_ENV=development`) defaults to **100 requests per 15 minutes** to support rapid demo workflows, automated tests, and local browser interactions. Production mode (`NODE_ENV=production`) strictly maintains the hardened limit of **10 requests per 15 minutes**.
* **ES Module Hoisting Trap Remediated:** Rate limiter configuration is now evaluated dynamically at request time and initialized via `import 'dotenv/config'`, eliminating a race condition where static imports bypassed newly loaded `.env` variables.
* **Frontend Error Resilience:** `client/src/services/auth.service.js` now defensively handles non-JSON proxy responses and extracts the standard RFC `Retry-After` header to display clear, actionable countdown notices to farmers.
* **100% Test Suite Verification:** All 384 backend unit tests (including 42 rate limiter unit tests) and 182 frontend tests pass with zero failures. Live end-to-end integration verified 27 assertions with 100% success.

---

## 2. Root Cause Analysis

Four distinct contributing factors caused the reported behavior:

```mermaid
flowchart TD
    A["Farmer Browser / Local Demo (127.0.0.1)"] -->|POST /api/v1/auth/login| B["Shared authRateLimiter Singleton"]
    A -->|POST /api/v1/auth/register| B
    
    subgraph Defect 1: Cross-Endpoint Collision
        B -->|Single Key: '127.0.0.1'| C["Shared Hit Counter"]
        C -->|Exhausts 10 Requests| D["Total Lockout (HTTP 429)"]
    end

    subgraph Defect 2: ESM Module Hoisting Trap
        E["node src/server.js"] -->|Static Import app.js| F["rateLimiter.middleware.js Evaluated"]
        F -->|process.env.AUTH_RATE_LIMIT_MAX is undefined| G["Bakes Hardcoded 10 Limit"]
        E -->|Executes dotenv.config() LATER| H["Environment Loaded Too Late"]
    end
    
    D --> I["Farmer Blocked on Both Login & Registration"]
    G --> I
```

### 1. Cross-Endpoint Shared Bucket Collision
* **Location:** `server/src/routes/auth.routes.js` and `server/src/middlewares/rateLimiter.middleware.js`
* **Defect:** In `auth.routes.js`, both `POST /register` and `POST /login` were mounted with the exact same middleware singleton instance: `authRateLimiter`. Inside `rateLimiter.middleware.js`, the cache key was computed purely as:
  ```javascript
  const clientKey = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  ```
* **Consequence:** Both endpoints shared a single hit counter for `127.0.0.1`. When previous manual tests or failed login attempts occurred (recorded in backend logs as `[Error]: Error: Invalid credentials`), they consumed the entire quota. When a user subsequently attempted registration, the counter was already exhausted, resulting in immediate HTTP 429 lockouts.

### 2. Node.js ES Module Static Hoisting Trap
* **Location:** `server/src/server.js` and `server/src/middlewares/rateLimiter.middleware.js`
* **Defect:** In `server.js`, static `import` declarations are hoisted by the JavaScript engine and evaluated before any top-level executable statements. `import app from './app.js'` imported `auth.routes.js`, which imported `rateLimiter.middleware.js`, which executed `createRateLimiter()`. At that instant, `dotenv.config()` had not yet executed!
* **Consequence:** `process.env.AUTH_RATE_LIMIT_MAX` was `undefined` and `process.env.NODE_ENV` was `undefined`. The ternary `process.env.NODE_ENV === 'development' ? 100 : 10` evaluated to `10`. By the time `dotenv.config()` loaded `.env`, the middleware had already hard-coded the `maxRequests = 10` limit into its closure.

### 3. Shared Localhost IP in Local Environments
* **Defect:** In local development, all requests from browser tabs, frontend Vite proxies, curl commands, and automated test scripts originate from `127.0.0.1` or `::1`.
* **Consequence:** A restrictive limit of 10 requests per 15 minutes is appropriate for public production ingress against credential stuffing, but in local development it caused frequent demo interruptions.

### 4. Verification of Frontend Submission Behavior
* **Inspection:** `client/src/features/auth/components/RegisterForm.jsx` and `LoginForm.jsx` were audited for duplicate submissions.
* **Finding:** Both components maintain local `loading` state set to `true` synchronously at the start of `handleSubmit` and bind `disabled={loading}` to their submit buttons:
  ```jsx
  <button type="submit" disabled={loading} className="...">
      {loading ? 'Registering...' : 'Register'}
  </button>
  ```
  The frontend does **not** double-submit requests. The issue was entirely backend key-sharing and hoisting-related.

---

## 3. Files Changed and Exact Fixes Applied

### 1. `server/src/middlewares/rateLimiter.middleware.js`
* **Route Partitioning:** Partitioned cache keys by route prefix (`${routePrefix}:${rawIp}`) so that `/api/v1/auth/register` and `/api/v1/auth/login` maintain independent sliding-window hit lists.
* **Dynamic Environment Evaluation:** Replaced static closure variables with lazy helper functions (`getWindowMs()` and `getMaxRequests()`) evaluated at request time.
* **Targeted Reset Support:** Added `limiter.reset(key)` for test suites and administrative controls.
* **Environment Defaults:** Default limit is 100 in development (`NODE_ENV === 'development'`) and 10 in production (`NODE_ENV === 'production'`).

```javascript
// server/src/middlewares/rateLimiter.middleware.js
export const createRateLimiter = (options = {}) => {
    const getWindowMs = () => {
        if (typeof options.windowMs === 'number') {
            return options.windowMs;
        }
        if (process.env.AUTH_RATE_LIMIT_WINDOW_MS) {
            return parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10);
        }
        return 15 * 60 * 1000; // 15 minutes default
    };

    const getMaxRequests = () => {
        if (typeof options.maxRequests === 'number') {
            return options.maxRequests;
        }
        if (process.env.AUTH_RATE_LIMIT_MAX) {
            return parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10);
        }
        return process.env.NODE_ENV === 'development' ? 100 : 10; // 100 in dev demo, 10 in production
    };

    const message = options.message || 'Too many authentication attempts. Please try again later.';
    const hits = new Map();

    // ... cleanup interval ...

    const limiter = (req, res, next) => {
        const windowMs = getWindowMs();
        const maxRequests = getMaxRequests();

        // Resolve client IP (respects Express req.ip and trust proxy configuration)
        const rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';

        // Partition buckets by route so registration and login do not exhaust each other's quota
        let routePrefix = '';
        if (options.partitionByRoute !== false) {
            if (options.routePrefix) {
                routePrefix = options.routePrefix;
            } else if (req.baseUrl || req.path || req.originalUrl) {
                routePrefix = req.baseUrl && req.path
                    ? `${req.baseUrl}${req.path}`
                    : (req.path || req.originalUrl?.split('?')[0] || '');
            }
        }
        const clientKey = routePrefix ? `${routePrefix}:${rawIp}` : rawIp;
        const now = Date.now();

        let timestamps = hits.get(clientKey) || [];
        timestamps = timestamps.filter(t => now - t < windowMs);

        if (timestamps.length >= maxRequests) {
            const oldest = timestamps[0];
            const retryAfterMs = oldest + windowMs - now;
            const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
            const resetTime = Math.ceil((oldest + windowMs) / 1000);

            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('RateLimit-Limit', maxRequests);
            res.setHeader('RateLimit-Remaining', 0);
            res.setHeader('RateLimit-Reset', resetTime);
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', resetTime);

            return res.status(429).json({
                success: false,
                message: `${message} (Retry after ${retryAfterSec} seconds)`,
                retryAfter: retryAfterSec
            });
        }

        timestamps.push(now);
        hits.set(clientKey, timestamps);
        // ... headers and next() ...
    };
    // ...
};
```

### 2. `server/src/server.js`
* Added `import 'dotenv/config';` as line 1 to ensure `.env` is loaded before any other submodules initialize.

### 3. `server/.env` and `server/.env.example`
* In `server/.env`: Removed duplicate `JWT_SECRET` entry and explicitly configured:
  ```env
  AUTH_RATE_LIMIT_WINDOW_MS=900000
  AUTH_RATE_LIMIT_MAX=100
  ```
* In `server/.env.example`: Documented the configuration semantics:
  ```env
  # Maximum permitted requests per route & IP address within the window
  # (Default: 10 in production, 100 in development)
  AUTH_RATE_LIMIT_MAX=10
  ```

### 4. `client/src/services/auth.service.js`
* Added protective `try/catch` around `response.json()` to prevent unhandled syntax errors when gateways return non-JSON responses.
* Added explicit HTTP 429 status detection with `Retry-After` header extraction:
  ```javascript
  if (!response.ok) {
      if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(
              data.message ||
              `Too many registration attempts. Please try again${retryAfter ? ` after ${retryAfter} seconds` : ' later'}.`
          );
      }
      throw new Error(data.message || 'Registration failed');
  }
  ```

### 5. `server/test_rate_limiter_unit.js`
* Added **Section 9**: Endpoint isolation test verifying that exhausting `/register` does not block `/login` for the same client IP.
* Added **Section 10**: Environment sensitivity test asserting that `NODE_ENV=production` strictly enforces 10 requests, while `NODE_ENV=development` defaults to 100 requests.

---

## 4. Verification and Test Results

### 1. Backend Unit Test Suite (`server/npm run test:unit`)
```
==================================================
Step 24.14 Authentication Rate Limiting Test Suite
==================================================
1. Requests Under Limit & Header Management
  ✅  Request 1 calls next()
  ✅  RateLimit-Limit is 3
  ✅  RateLimit-Remaining is 2 after request 1
  ✅  X-RateLimit-Limit is 3
  ✅  X-RateLimit-Remaining is 2
  ✅  Request 2 calls next()
  ✅  RateLimit-Remaining is 1 after request 2
  ✅  Request 3 calls next()
  ✅  RateLimit-Remaining is 0 after request 3
2. Rate Limit Enforcement (HTTP 429)
  ✅  Request 4 does NOT call next()
  ✅  Request 4 responds with HTTP 429 Too Many Requests
  ✅  429 response body includes success: false
  ✅  429 response message explains limit reached
  ✅  429 response includes retryAfter number in seconds
  ✅  429 response includes standard Retry-After header
  ✅  429 response sets RateLimit-Remaining to 0
  ✅  Request 5 still blocked
  ✅  Request 5 responds with HTTP 429
3. Multi-Tenant Client IP Isolation
  ✅  Different IP (10.0.0.2) is NOT blocked by 10.0.0.1 limit
  ✅  Different IP has its own full remaining allowance
4. Reset & Cleanup Behavior
  ✅  Request 1 succeeds after reset()
  ✅  Allowance is restored to 2 after reset()
5. Configurable Window & Max Requests Options
  ✅  Custom maxRequests: 2 applied
  ✅  Blocks at threshold 2 with HTTP 429
  ✅  Custom message rendered in response
6. Router Layer Middleware Mounting
  ✅  Route POST /register exists
  ✅  Route POST /login exists
  ✅  Route GET /me exists
  ✅  Route PATCH /profile exists
  ✅  POST /register route stack contains rateLimiter, validator, and controller
  ✅  POST /login route stack contains rateLimiter, validator, and controller
7. Security & Credential Isolation
  ✅  Never logs passwords under any circumstance
  ✅  Never logs user emails
  ✅  Never logs JWT tokens
8. Singleton authRateLimiter Instance
  ✅  authRateLimiter is exported as an Express middleware function
9. Route Partitioning & Endpoint Isolation
  ✅  Request 1 to /register succeeds
  ✅  Request 2 to /register succeeds
  ✅  Third request to /register is rate-limited (HTTP 429)
  ✅  Request to /login is NOT blocked by exhausted /register quota
  ✅  Login has its own fresh remaining allowance (1 left)
10. Environment Sensitivity (Development vs Production Limits)
  ✅  Production default limit is strictly 10 requests
  ✅  Development default limit is 100 requests
==================================================
Results: 42 PASSED, 0 FAILED
==================================================
Total Backend Suite: 384 PASSED, 0 FAILED across all 10 test modules.
```

### 2. Frontend Unit Test Suite (`client/npm run test:unit`)
```
==================================================
Results: 182 PASSED, 0 FAILED across 5 test modules.
- Client API Configuration: 37 PASSED
- Rainfall Input Guidance: 27 PASSED
- Navigation and Header: 40 PASSED
- React Router Integration: 43 PASSED
- User Profile & Remediation: 35 PASSED
==================================================
```

### 3. Live End-to-End Service Audit (`test_verify_auth_rate_limiting.mjs`)
Direct HTTP verification against the live running Express server (`http://localhost:5000`):
```
==================================================
Step 24.30 Live Authentication & Rate Limit Audit
==================================================

1. Express Backend Health Check
  ✅  Health check HTTP 200 (actual: 200)
  ✅  Health check status is OK/success (actual: success)

2. User Registration Flow (POST /api/v1/auth/register)
  ✅  Registration returned HTTP 201 Created (actual: 201)
  ✅  Registration response includes RateLimit-Limit header
  ✅  Registration response includes RateLimit-Remaining header
  ✅  Development rate limit configured to 100 (actual: 100)
  ✅  RateLimit-Remaining decremented to 99 (actual: 99)
  ✅  Registration payload has success: true
  ✅  Registered user email matches: farmer_demo_1792939885478@test.in
  ✅  Second registration decrements remaining to 98 (actual: 98)

3. User Login Flow (POST /api/v1/auth/login)
  ✅  Login returned HTTP 200 OK (actual: 200)
  ✅  Login response includes RateLimit-Limit header
  ✅  Login response includes RateLimit-Remaining header
  ✅  Login has its own independent quota: remaining = 99 (actual: 99)
  ✅  Login payload has success: true
  ✅  Login returned valid JWT token
  ✅  Second login decrements login remaining to 98 (actual: 98)

4. Profile Retrieval Flow (GET /api/v1/auth/me)
  ✅  GET /me returned HTTP 200 OK (actual: 200)
  ✅  Profile response has success: true
  ✅  Profile user email matches: farmer_demo_1792939885478@test.in
  ✅  Profile user name matches: Ramesh Patel
  ✅  Profile user mobile matches: 9876543210
  ✅  Profile user location matches: Nashik, Maharashtra

5. Safe Failure on Invalid Credentials
  ✅  Invalid credentials returns HTTP 401 Unauthorized (actual: 401)
  ✅  Invalid login response has success: false
  ✅  Error message is sanitized: "Invalid credentials" (actual: Invalid credentials)
  ✅  Non-existent user returns HTTP 401 Unauthorized (actual: 401)

==================================================
Results: 27 PASSED, 0 FAILED
==================================================
```

---

## 5. Confirmation of Production Rate Limiting

The fix was designed strictly to avoid weakening security in production:
1. **Production Limit Preserved:** When `NODE_ENV=production` is set, `getMaxRequests()` defaults to `10` requests per 15 minutes unless explicitly overridden by `AUTH_RATE_LIMIT_MAX`.
2. **Brute Force Protection Intact:** Route partitioning ensures that an attacker attempting brute-force dictionary attacks against `POST /login` will still be locked out after 10 attempts in production.
3. **Mass Registration Protection Intact:** Automated bot registrations against `POST /register` will be locked out after 10 attempts in production.
4. **Credential Privacy Invariant:** At no point are passwords, JWT tokens, or email addresses logged or inspected by the rate limiter middleware.
5. **Standard HTTP Headers:** All responses supply standard RFC headers (`Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

---

## 6. Active Demo Services Status

The local demo environment is active and ready for user interactions:

| Service | Port | Local URL | Health URL | Status |
|---|---|---|---|---|
| **React / Vite Frontend** | 3000 | [http://localhost:3000](http://localhost:3000) | [http://localhost:3000](http://localhost:3000) | **Active** (HMR enabled) |
| **Express API Backend** | 5000 | [http://localhost:5000](http://localhost:5000) | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | **Active** (Connected to MongoDB) |
| **FastAPI ML Service** | 8000 | [http://127.0.0.1:8000](http://127.0.0.1:8000) | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) | **Active** (All ML models loaded) |
| **MongoDB Database** | 27017 | `mongodb://localhost:27017/crop_db` | — | **Active** (`crop_db`) |

---

## 7. Manual User Actions

No manual configuration or command line actions are required. You can use KrishiMitra AI immediately:
1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Click **"Register here"** to create a new farmer account (or use any registered credentials).
3. Registration will complete immediately with HTTP 201 without encountering rate-limiting errors.
4. Log in with the newly registered email and password.
5. All features—including Crop Recommendation, Farm Management, Soil Information, Mandi Market Rates, Crop Disease Detection, and Farmer Profile—are functional.
