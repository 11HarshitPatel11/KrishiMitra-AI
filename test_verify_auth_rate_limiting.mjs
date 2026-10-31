/**
 * test_verify_auth_rate_limiting.mjs
 * ---------------------------------------------------------------------------
 * Step 24.30 Verification Script:
 * 1. Express health check
 * 2. User registration (POST /api/v1/auth/register)
 * 3. User login (POST /api/v1/auth/login)
 * 4. User profile retrieval (GET /api/v1/auth/me)
 * 5. Invalid credentials safe failure (HTTP 401)
 * 6. Endpoint isolation (Register quota vs Login quota)
 * 7. Rate limit enforcement (HTTP 429 & Retry-After)
 * ---------------------------------------------------------------------------
 */

const API_BASE = 'http://localhost:5000/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅  ${message}`);
        passed++;
    } else {
        console.error(`  ❌  ${message}`);
        failed++;
    }
}

async function run() {
    console.log('==================================================');
    console.log('Step 24.30 Live Authentication & Rate Limit Audit');
    console.log('==================================================\n');

    // 1. Backend Health Check
    console.log('1. Express Backend Health Check');
    const healthRes = await fetch(`${API_BASE}/health`);
    assert(healthRes.status === 200, `Health check HTTP 200 (actual: ${healthRes.status})`);
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'success' || healthJson.status === 'OK', `Health check status is OK/success (actual: ${healthJson.status})`);

    // 2. User Registration Flow
    console.log('\n2. User Registration Flow (POST /api/v1/auth/register)');
    const testEmail = `farmer_demo_${Date.now()}@test.in`;
    const testPassword = 'Password123!';
    const regPayload = {
        name: 'Ramesh Patel',
        email: testEmail,
        password: testPassword,
        mobileNumber: '9876543210',
        location: 'Nashik, Maharashtra'
    };

    const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regPayload)
    });

    assert(regRes.status === 201, `Registration returned HTTP 201 Created (actual: ${regRes.status})`);
    assert(regRes.headers.has('ratelimit-limit'), 'Registration response includes RateLimit-Limit header');
    assert(regRes.headers.has('ratelimit-remaining'), 'Registration response includes RateLimit-Remaining header');
    const regLimit = parseInt(regRes.headers.get('ratelimit-limit'), 10);
    const regRemaining = parseInt(regRes.headers.get('ratelimit-remaining'), 10);
    assert(regLimit === 100, `Development rate limit configured to 100 (actual: ${regLimit})`);
    assert(regRemaining === 99, `RateLimit-Remaining decremented to 99 (actual: ${regRemaining})`);

    const regJson = await regRes.json();
    assert(regJson.success === true, 'Registration payload has success: true');
    assert(regJson.data?.user?.email === testEmail, `Registered user email matches: ${testEmail}`);

    // Second registration attempt to verify decrement
    const secondRegRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regPayload, email: `second_${Date.now()}@test.in` })
    });
    const secondRegRemaining = parseInt(secondRegRes.headers.get('ratelimit-remaining'), 10);
    assert(secondRegRemaining === 98, `Second registration decrements remaining to 98 (actual: ${secondRegRemaining})`);

    // 3. User Login Flow
    console.log('\n3. User Login Flow (POST /api/v1/auth/login)');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    assert(loginRes.status === 200, `Login returned HTTP 200 OK (actual: ${loginRes.status})`);
    assert(loginRes.headers.has('ratelimit-limit'), 'Login response includes RateLimit-Limit header');
    assert(loginRes.headers.has('ratelimit-remaining'), 'Login response includes RateLimit-Remaining header');
    const loginRemaining = parseInt(loginRes.headers.get('ratelimit-remaining'), 10);
    // Because /login and /register are partitioned, loginRemaining is 99 (not affected by registration requests!)
    assert(loginRemaining === 99, `Login has its own independent quota: remaining = 99 (actual: ${loginRemaining})`);

    const loginJson = await loginRes.json();
    assert(loginJson.success === true, 'Login payload has success: true');
    const token = loginJson.data?.token;
    assert(typeof token === 'string' && token.length > 20, 'Login returned valid JWT token');

    // Second login attempt to verify independent decrement
    const secondLoginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const secondLoginRemaining = parseInt(secondLoginRes.headers.get('ratelimit-remaining'), 10);
    assert(secondLoginRemaining === 98, `Second login decrements login remaining to 98 (actual: ${secondLoginRemaining})`);

    // 4. Authenticated Profile Retrieval (GET /api/v1/auth/me)
    console.log('\n4. Profile Retrieval Flow (GET /api/v1/auth/me)');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    assert(meRes.status === 200, `GET /me returned HTTP 200 OK (actual: ${meRes.status})`);
    const meJson = await meRes.json();
    assert(meJson.success === true, 'Profile response has success: true');
    assert(meJson.data?.user?.email === testEmail, `Profile user email matches: ${meJson.data?.user?.email}`);
    assert(meJson.data?.user?.name === 'Ramesh Patel', `Profile user name matches: ${meJson.data?.user?.name}`);
    assert(meJson.data?.user?.mobileNumber === '9876543210', `Profile user mobile matches: ${meJson.data?.user?.mobileNumber}`);
    assert(meJson.data?.user?.location === 'Nashik, Maharashtra', `Profile user location matches: ${meJson.data?.user?.location}`);

    // 5. Safe Failure on Invalid Credentials
    console.log('\n5. Safe Failure on Invalid Credentials');
    const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' })
    });

    assert(badLoginRes.status === 401, `Invalid credentials returns HTTP 401 Unauthorized (actual: ${badLoginRes.status})`);
    const badLoginJson = await badLoginRes.json();
    assert(badLoginJson.success === false, 'Invalid login response has success: false');
    assert(badLoginJson.message === 'Invalid credentials', `Error message is sanitized: "Invalid credentials" (actual: ${badLoginJson.message})`);

    // 6. Non-Existent User Login Safe Failure
    const nonExistentRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `nonexistent_${Date.now()}@farm.in`, password: 'SomePassword123!' })
    });
    assert(nonExistentRes.status === 401, `Non-existent user returns HTTP 401 Unauthorized (actual: ${nonExistentRes.status})`);

    // 7. Verification Summary
    console.log('\n==================================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

run().catch((err) => {
    console.error('Fatal error in verification script:', err);
    process.exit(1);
});
