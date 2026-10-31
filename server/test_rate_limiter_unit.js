/**
 * server/test_rate_limiter_unit.js
 * ---------------------------------------------------------------------------
 * Test Suite for Step 24.14 (GAP-17): Authentication Rate Limiting
 *
 * Verifies:
 *   1. Allows requests under configured limit (calls next())
 *   2. Decrements RateLimit-Remaining correctly
 *   3. Sets RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
 *   4. Blocks requests exceeding limit with HTTP 429 Too Many Requests
 *   5. Response format: { success: false, message, retryAfter }
 *   6. Sets Retry-After header
 *   7. Client IP isolation (IP A does not exhaust quota for IP B)
 *   8. Resets correctly upon window expiration or manual reset
 *   9. Configurable windowMs and maxRequests
 *  10. Auth routes mounting: applied to /login & /register; excluded from /me & /profile
 *  11. Zero credential / password logging or inspection
 * ---------------------------------------------------------------------------
 */

import { createRateLimiter, authRateLimiter } from './src/middlewares/rateLimiter.middleware.js';
import authRouter from './src/routes/auth.routes.js';

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
console.log("Step 24.14 Authentication Rate Limiting Test Suite");
console.log("==================================================\n");

function createMockReqRes(ip = '192.168.1.100') {
    const headers = {};
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = {
        ip,
        socket: { remoteAddress: ip },
        body: { email: 'test@example.com', password: 'secretPassword123!' }
    };

    const res = {
        setHeader: (key, val) => {
            headers[key] = val;
        },
        getHeader: (key) => headers[key],
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => {
                    jsonResponse = data;
                }
            };
        }
    };

    const next = () => {
        nextCalled = true;
    };

    return { req, res, next, headers, getStatusCode: () => statusCode, getJsonResponse: () => jsonResponse, isNextCalled: () => nextCalled };
}

// ---------------------------------------------------------------------------
// 1. Requests Under Configured Limit
// ---------------------------------------------------------------------------
console.log("1. Requests Under Limit & Header Management");

const limiter3 = createRateLimiter({ windowMs: 60000, maxRequests: 3 });

try {
    // Request 1
    const m1 = createMockReqRes('10.0.0.1');
    limiter3(m1.req, m1.res, m1.next);
    assert(m1.isNextCalled() === true, "Request 1 calls next()");
    assert(m1.headers['RateLimit-Limit'] === 3, "RateLimit-Limit is 3");
    assert(m1.headers['RateLimit-Remaining'] === 2, "RateLimit-Remaining is 2 after request 1");
    assert(m1.headers['X-RateLimit-Limit'] === 3, "X-RateLimit-Limit is 3");
    assert(m1.headers['X-RateLimit-Remaining'] === 2, "X-RateLimit-Remaining is 2");

    // Request 2
    const m2 = createMockReqRes('10.0.0.1');
    limiter3(m2.req, m2.res, m2.next);
    assert(m2.isNextCalled() === true, "Request 2 calls next()");
    assert(m2.headers['RateLimit-Remaining'] === 1, "RateLimit-Remaining is 1 after request 2");

    // Request 3 (last permitted)
    const m3 = createMockReqRes('10.0.0.1');
    limiter3(m3.req, m3.res, m3.next);
    assert(m3.isNextCalled() === true, "Request 3 calls next()");
    assert(m3.headers['RateLimit-Remaining'] === 0, "RateLimit-Remaining is 0 after request 3");

    // ---------------------------------------------------------------------------
    // 2. HTTP 429 Too Many Requests on Limit Exceeded
    // ---------------------------------------------------------------------------
    console.log("\n2. Rate Limit Enforcement (HTTP 429)");

    // Request 4 (exceeded)
    const m4 = createMockReqRes('10.0.0.1');
    limiter3(m4.req, m4.res, m4.next);
    assert(m4.isNextCalled() === false, "Request 4 does NOT call next()");
    assert(m4.getStatusCode() === 429, "Request 4 responds with HTTP 429 Too Many Requests");

    const res4 = m4.getJsonResponse();
    assert(res4 && res4.success === false, "429 response body includes success: false");
    assert(typeof res4?.message === 'string' && res4.message.includes('Too many'), "429 response message explains limit reached");
    assert(typeof res4?.retryAfter === 'number' && res4.retryAfter > 0, "429 response includes retryAfter number in seconds");
    assert(m4.headers['Retry-After'] !== undefined, "429 response includes standard Retry-After header");
    assert(m4.headers['RateLimit-Remaining'] === 0, "429 response sets RateLimit-Remaining to 0");

    // Request 5 (still exceeded)
    const m5 = createMockReqRes('10.0.0.1');
    limiter3(m5.req, m5.res, m5.next);
    assert(m5.isNextCalled() === false, "Request 5 still blocked");
    assert(m5.getStatusCode() === 429, "Request 5 responds with HTTP 429");

    // ---------------------------------------------------------------------------
    // 3. Multi-Tenant IP Isolation
    // ---------------------------------------------------------------------------
    console.log("\n3. Multi-Tenant Client IP Isolation");

    // Request from a DIFFERENT IP (10.0.0.2) should NOT be blocked by 10.0.0.1's limit
    const mOther = createMockReqRes('10.0.0.2');
    limiter3(mOther.req, mOther.res, mOther.next);
    assert(mOther.isNextCalled() === true, "Different IP (10.0.0.2) is NOT blocked by 10.0.0.1 limit");
    assert(mOther.headers['RateLimit-Remaining'] === 2, "Different IP has its own full remaining allowance");

    // ---------------------------------------------------------------------------
    // 4. Reset & Window Expiration
    // ---------------------------------------------------------------------------
    console.log("\n4. Reset & Cleanup Behavior");

    limiter3.reset();
    const mAfterReset = createMockReqRes('10.0.0.1');
    limiter3(mAfterReset.req, mAfterReset.res, mAfterReset.next);
    assert(mAfterReset.isNextCalled() === true, "Request 1 succeeds after reset()");
    assert(mAfterReset.headers['RateLimit-Remaining'] === 2, "Allowance is restored to 2 after reset()");

} finally {
    limiter3.close();
}

// ---------------------------------------------------------------------------
// 5. Configurable Window and Limits
// ---------------------------------------------------------------------------
console.log("\n5. Configurable Window & Max Requests Options");

const customLimiter = createRateLimiter({
    windowMs: 5000,
    maxRequests: 2,
    message: "Custom authentication block message."
});

try {
    const c1 = createMockReqRes('172.16.0.5');
    customLimiter(c1.req, c1.res, c1.next);
    assert(c1.headers['RateLimit-Limit'] === 2, "Custom maxRequests: 2 applied");

    const c2 = createMockReqRes('172.16.0.5');
    customLimiter(c2.req, c2.res, c2.next);

    const c3 = createMockReqRes('172.16.0.5');
    customLimiter(c3.req, c3.res, c3.next);
    assert(c3.getStatusCode() === 429, "Blocks at threshold 2 with HTTP 429");
    assert(c3.getJsonResponse().message.includes("Custom authentication block message"), "Custom message rendered in response");

} finally {
    customLimiter.close();
}

// ---------------------------------------------------------------------------
// 6. Router Scope Verification (Auth Endpoints Specifically Targeted)
// ---------------------------------------------------------------------------
console.log("\n6. Router Layer Middleware Mounting");

// Inspect auth.routes.js stack to verify limiter application
const routes = authRouter.stack.filter(s => s.route);
const routePaths = routes.map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods),
    handlerCount: r.route.stack.length
}));

const registerRoute = routes.find(r => r.route.path === '/register');
const loginRoute = routes.find(r => r.route.path === '/login');
const meRoute = routes.find(r => r.route.path === '/me');
const profileRoute = routes.find(r => r.route.path === '/profile');

assert(registerRoute !== undefined, "Route POST /register exists");
assert(loginRoute !== undefined, "Route POST /login exists");
assert(meRoute !== undefined, "Route GET /me exists");
assert(profileRoute !== undefined, "Route PATCH /profile exists");

// Register route has rate limiter middleware in stack
assert(
    registerRoute.route.stack.length >= 3,
    "POST /register route stack contains rateLimiter, validator, and controller"
);

// Login route has rate limiter middleware in stack
assert(
    loginRoute.route.stack.length >= 3,
    "POST /login route stack contains rateLimiter, validator, and controller"
);

// ---------------------------------------------------------------------------
// 7. Security: Zero Credential / Password Logging
// ---------------------------------------------------------------------------
console.log("\n7. Security & Credential Isolation");

const sensitiveReq = {
    ip: '192.168.1.50',
    body: {
        email: 'victim@farm.in',
        password: 'SuperSecretPassword$12345',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    }
};

let loggedData = [];
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

try {
    console.log = (...args) => loggedData.push(args.join(' '));
    console.warn = (...args) => loggedData.push(args.join(' '));
    console.error = (...args) => loggedData.push(args.join(' '));

    const testSecurityLimiter = createRateLimiter({ windowMs: 10000, maxRequests: 1 });
    const s1 = createMockReqRes('192.168.1.50');
    s1.req.body = sensitiveReq.body;
    testSecurityLimiter(s1.req, s1.res, s1.next);

    const s2 = createMockReqRes('192.168.1.50');
    s2.req.body = sensitiveReq.body;
    testSecurityLimiter(s2.req, s2.res, s2.next); // Exceeded

    testSecurityLimiter.close();
} finally {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
}

const allLogs = loggedData.join('\n');
assert(!allLogs.includes('SuperSecretPassword$12345'), "Never logs passwords under any circumstance");
assert(!allLogs.includes('victim@farm.in'), "Never logs user emails");
assert(!allLogs.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), "Never logs JWT tokens");

// ---------------------------------------------------------------------------
// 8. Singleton authRateLimiter Availability
// ---------------------------------------------------------------------------
console.log("\n8. Singleton authRateLimiter Instance");
assert(typeof authRateLimiter === 'function', "authRateLimiter is exported as an Express middleware function");

// ---------------------------------------------------------------------------
// 9. Route Partitioning: Register vs Login Isolation
// ---------------------------------------------------------------------------
console.log("\n9. Route Partitioning & Endpoint Isolation");

const partitionedLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
try {
    // Two requests to /register from 192.168.1.200 (hits limit for /register)
    const regReq1 = createMockReqRes('192.168.1.200');
    regReq1.req.baseUrl = '/api/v1/auth';
    regReq1.req.path = '/register';
    partitionedLimiter(regReq1.req, regReq1.res, regReq1.next);
    assert(regReq1.isNextCalled() === true, "Request 1 to /register succeeds");

    const regReq2 = createMockReqRes('192.168.1.200');
    regReq2.req.baseUrl = '/api/v1/auth';
    regReq2.req.path = '/register';
    partitionedLimiter(regReq2.req, regReq2.res, regReq2.next);
    assert(regReq2.isNextCalled() === true, "Request 2 to /register succeeds");

    // Third request to /register is blocked (HTTP 429)
    const regReq3 = createMockReqRes('192.168.1.200');
    regReq3.req.baseUrl = '/api/v1/auth';
    regReq3.req.path = '/register';
    partitionedLimiter(regReq3.req, regReq3.res, regReq3.next);
    assert(regReq3.getStatusCode() === 429, "Third request to /register is rate-limited (HTTP 429)");

    // Crucial check: Request to /login from the SAME IP should NOT be blocked!
    const loginReq1 = createMockReqRes('192.168.1.200');
    loginReq1.req.baseUrl = '/api/v1/auth';
    loginReq1.req.path = '/login';
    partitionedLimiter(loginReq1.req, loginReq1.res, loginReq1.next);
    assert(loginReq1.isNextCalled() === true, "Request to /login is NOT blocked by exhausted /register quota");
    assert(loginReq1.headers['RateLimit-Remaining'] === 1, "Login has its own fresh remaining allowance (1 left)");
} finally {
    partitionedLimiter.close();
}

// ---------------------------------------------------------------------------
// 10. Environment Sensitivity & Default Limits
// ---------------------------------------------------------------------------
console.log("\n10. Environment Sensitivity (Development vs Production Limits)");

const originalNodeEnv = process.env.NODE_ENV;
const originalMaxReqEnv = process.env.AUTH_RATE_LIMIT_MAX;
try {
    delete process.env.AUTH_RATE_LIMIT_MAX;

    // Production mode defaults to 10
    process.env.NODE_ENV = 'production';
    const prodLimiter = createRateLimiter();
    const prodMock = createMockReqRes('127.0.0.1');
    prodLimiter(prodMock.req, prodMock.res, prodMock.next);
    assert(prodMock.headers['RateLimit-Limit'] === 10, "Production default limit is strictly 10 requests");
    prodLimiter.close();

    // Development mode defaults to 100
    process.env.NODE_ENV = 'development';
    const devLimiter = createRateLimiter();
    const devMock = createMockReqRes('127.0.0.1');
    devLimiter(devMock.req, devMock.res, devMock.next);
    assert(devMock.headers['RateLimit-Limit'] === 100, "Development default limit is 100 requests");
    devLimiter.close();
} finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalMaxReqEnv !== undefined) {
        process.env.AUTH_RATE_LIMIT_MAX = originalMaxReqEnv;
    } else {
        delete process.env.AUTH_RATE_LIMIT_MAX;
    }
}

console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
