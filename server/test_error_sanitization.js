/**
 * server/test_error_sanitization.js
 * ---------------------------------------------------------------------------
 * Step 24.24 (BLK-06) Error Sanitization Unit Test Suite
 * ---------------------------------------------------------------------------
 */

import assert from 'assert';
import { errorHandler } from './src/middlewares/error.middleware.js';

let passed = 0;
let failed = 0;

const test = (label, fn) => {
    try {
        fn();
        console.log(`  ✅  ${label}`);
        passed++;
    } catch (err) {
        console.error(`  ❌  ${label}`);
        console.error(`      ${err.message}`);
        failed++;
    }
};

const createMockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    return res;
};

console.log('==================================================');
console.log('Step 24.24 Error Sanitization Unit Test Suite');
console.log('==================================================');

// Save original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

try {
    // -----------------------------------------------------------------------
    // 1. Production Mode Sanitization (NODE_ENV = 'production')
    // -----------------------------------------------------------------------
    console.log('\n1. Production Mode Error Sanitization (NODE_ENV=production)');
    process.env.NODE_ENV = 'production';

    test('Masks sensitive database crash error message in 500 response', () => {
        const sensitiveError = new Error('MongoServerError: Authentication failed at mongodb+srv://admin:p@ssw0rd@cluster.net');
        const res = createMockRes();
        errorHandler(sensitiveError, {}, res, () => {});

        assert.strictEqual(res.statusCode, 500);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.message, 'Internal server error');
        assert.strictEqual(res.body.errors[0].message, 'An unexpected error occurred. Please try again later.');
        assert(!JSON.stringify(res.body).includes('p@ssw0rd'), 'Never leaks sensitive database credentials');
        assert(!JSON.stringify(res.body).includes('cluster.net'), 'Never leaks internal database host');
    });

    test('Masks filesystem path leak in 500 response', () => {
        const fsError = new Error('ENOENT: no such file or directory, open "C:\\secure\\keys\\private.key"');
        const res = createMockRes();
        errorHandler(fsError, {}, res, () => {});

        assert.strictEqual(res.statusCode, 500);
        assert.strictEqual(res.body.errors[0].message, 'An unexpected error occurred. Please try again later.');
        assert(!JSON.stringify(res.body).includes('private.key'), 'Never leaks private key path');
    });

    test('Preserves HTTP 400 Bad Request client message in production', () => {
        const clientErr = new Error('Invalid email format');
        clientErr.statusCode = 400;
        const res = createMockRes();
        errorHandler(clientErr, {}, res, () => {});

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Invalid email format');
        assert.strictEqual(res.body.errors[0].message, 'Invalid email format');
    });

    test('Preserves HTTP 401 Unauthorized client message in production', () => {
        const clientErr = new Error('Invalid credentials');
        clientErr.statusCode = 401;
        const res = createMockRes();
        errorHandler(clientErr, {}, res, () => {});

        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res.body.message, 'Invalid credentials');
    });

    test('Preserves HTTP 404 Not Found client message in production', () => {
        const clientErr = new Error('Farm not found');
        clientErr.statusCode = 404;
        const res = createMockRes();
        errorHandler(clientErr, {}, res, () => {});

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.body.message, 'Farm not found');
    });

    test('Preserves HTTP 409 Conflict client message in production', () => {
        const clientErr = new Error('Cannot delete farm: dependent records exist');
        clientErr.statusCode = 409;
        const res = createMockRes();
        errorHandler(clientErr, {}, res, () => {});

        assert.strictEqual(res.statusCode, 409);
        assert.strictEqual(res.body.message, 'Cannot delete farm: dependent records exist');
    });

    // -----------------------------------------------------------------------
    // 2. Non-Production Mode (Development / Test) Diagnostics
    // -----------------------------------------------------------------------
    console.log('\n2. Non-Production Diagnostic Error Reporting (NODE_ENV=development)');
    process.env.NODE_ENV = 'development';

    test('Exposes specific error message in development for debugging', () => {
        const debugErr = new Error('SyntaxError: Unexpected token in JSON at position 42');
        const res = createMockRes();
        errorHandler(debugErr, {}, res, () => {});

        assert.strictEqual(res.statusCode, 500);
        assert.strictEqual(res.body.errors[0].message, 'SyntaxError: Unexpected token in JSON at position 42');
    });

    // -----------------------------------------------------------------------
    // 3. Mongoose Specialized Error Formats
    // -----------------------------------------------------------------------
    console.log('\n3. Mongoose Specialized Error Handlers');
    test('Handles Mongoose duplicate key error (code 11000)', () => {
        const dupError = { code: 11000, keyValue: { email: 'farmer@example.com' } };
        const res = createMockRes();
        errorHandler(dupError, {}, res, () => {});

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Duplicate key error');
        assert(res.body.errors[0].message.includes('email already exists'));
    });

    test('Handles Mongoose ValidationError', () => {
        const valError = {
            name: 'ValidationError',
            errors: {
                area: { path: 'area', message: 'Area must be greater than 0' }
            }
        };
        const res = createMockRes();
        errorHandler(valError, {}, res, () => {});

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Validation failed');
        assert.strictEqual(res.body.errors[0].path, 'area');
        assert.strictEqual(res.body.errors[0].message, 'Area must be greater than 0');
    });

    test('Handles Mongoose CastError for invalid ObjectId', () => {
        const castError = {
            name: 'CastError',
            path: '_id',
            value: 'invalid-id-123'
        };
        const res = createMockRes();
        errorHandler(castError, {}, res, () => {});

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.message, 'Invalid resource identifier format');
        assert(res.body.errors[0].message.includes('Invalid _id: invalid-id-123'));
    });

    // -----------------------------------------------------------------------
    // 4. Weather Service & Controller Diagnostic Logging & Response Sanitization
    // -----------------------------------------------------------------------
    console.log('\n4. Weather Diagnostic Logging & Error Sanitization');
    const originalWeatherBaseUrl = process.env.WEATHER_API_BASE_URL;
    try {
        process.env.WEATHER_API_BASE_URL = 'http://127.0.0.1:1';
        const { getWeather } = await import('./src/controllers/weather.controller.js');

        const loggedErrors = [];
        const originalConsoleError = console.error;
        console.error = (...args) => {
            loggedErrors.push(args.join(' '));
        };

        const res = createMockRes();
        await getWeather({ query: { latitude: '22.7196', longitude: '75.8577' } }, res, () => {});

        console.error = originalConsoleError;

        test('Weather controller returns HTTP 503 on upstream failure', () => {
            assert.strictEqual(res.statusCode, 503);
            assert.strictEqual(res.body.success, false);
            assert.strictEqual(res.body.message, 'Weather service is currently unavailable.');
        });

        test('Weather controller strictly sanitizes 503 response without leaking internal errors or host', () => {
            const bodyStr = JSON.stringify(res.body);
            assert(!bodyStr.includes('127.0.0.1'), 'Never leaks internal host/port');
            assert(!bodyStr.includes('ECONNREFUSED'), 'Never leaks system error code');
            assert(!bodyStr.includes('fetch failed'), 'Never leaks internal fetch stack message');
            assert.strictEqual(Object.keys(res.body).length, 2, 'Only returns success and message keys');
        });

        test('Weather diagnostics are logged to server console via console.error', () => {
            assert(loggedErrors.some(msg => msg.includes('[WeatherService]') && msg.includes('Weather fetch failed')), 'Logs WeatherService fetch failure');
            assert(loggedErrors.some(msg => msg.includes('[WeatherController]') && msg.includes('Weather retrieval failed')), 'Logs WeatherController error');
        });
    } finally {
        if (originalWeatherBaseUrl !== undefined) {
            process.env.WEATHER_API_BASE_URL = originalWeatherBaseUrl;
        } else {
            delete process.env.WEATHER_API_BASE_URL;
        }
    }

} finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
}

console.log('\n==================================================');
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) {
    process.exit(1);
}
