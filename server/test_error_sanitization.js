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

    // -----------------------------------------------------------------------
    // 5. Weather In-Memory Caching & Rate-Limit Resiliency Unit Tests
    // -----------------------------------------------------------------------
    console.log('\n5. Weather In-Memory Caching & Rate-Limit Resiliency');
    const {
        getCurrentWeather,
        parseRetryAfter,
        _resetWeatherState,
        _setWeatherCacheEntry,
        _setRateLimitCooldown,
        _getRateLimitBackoffUntil,
        _getWeatherCacheSize,
        _MAX_CACHE_ENTRIES
    } = await import('./src/services/weather.service.js');
    const { getWeather } = await import('./src/controllers/weather.controller.js');

    // 1. Fresh Cache Hit
    _resetWeatherState();
    const mockWeather = {
        temperature: 24.5,
        humidity: 65,
        rainfall: null,
        rainfall_status: 'not_aligned'
    };
    const now = Date.now();
    _setWeatherCacheEntry(22.7196, 75.8577, {
        data: mockWeather,
        cachedAt: now,
        expiresAt: now + (20 * 60 * 1000)
    });

    // Set invalid base URL; if it hits upstream, it would throw
    process.env.WEATHER_API_BASE_URL = 'http://127.0.0.1:1';
    try {
        const freshResult = await getCurrentWeather(22.7196, 75.8577);
        test('Fresh cache hit returns cached data without calling upstream', () => {
            assert.strictEqual(freshResult.temperature, 24.5);
            assert.strictEqual(freshResult.humidity, 65);
        });

        test('Quantized coordinate rounding (2 decimals) matches cache', async () => {
            // 22.7199 and 75.8576 round to 22.72 and 75.86
            const roundedResult = await getCurrentWeather(22.7199, 75.8576);
            assert.strictEqual(roundedResult.temperature, 24.5);
        });

        // 2. Cache Expiration & Stale-If-Error Fallback (<= 60 min)
        _resetWeatherState();
        _setWeatherCacheEntry(22.7196, 75.8577, {
            data: mockWeather,
            cachedAt: now - (30 * 60 * 1000), // 30 min old (expired fresh TTL, but <= 60 min stale limit)
            expiresAt: now - (10 * 60 * 1000)
        });

        // Upstream fails (127.0.0.1:1), should fall back to stale cache
        const staleFallbackResult = await getCurrentWeather(22.7196, 75.8577);
        test('Stale cache fallback recovers during upstream outage (<= 60 min old)', () => {
            assert.strictEqual(staleFallbackResult.temperature, 24.5);
        });

        // 3. Stale Cache Expiration (> 60 min) Must NOT Be Served
        _resetWeatherState();
        _setWeatherCacheEntry(22.7196, 75.8577, {
            data: mockWeather,
            cachedAt: now - (65 * 60 * 1000), // 65 min old (> 60 min stale limit)
            expiresAt: now - (45 * 60 * 1000)
        });

        let expiredErrorThrown = false;
        try {
            await getCurrentWeather(22.7196, 75.8577);
        } catch (err) {
            expiredErrorThrown = true;
        }
        test('Stale cache older than 60 minutes is rejected on upstream failure', () => {
            assert.strictEqual(expiredErrorThrown, true);
        });

        // 4. Rate-Limit 429 Cooldown Enforcement
        _resetWeatherState();
        _setRateLimitCooldown(Date.now() + 60000); // 60s in future

        let cooldownError = null;
        try {
            await getCurrentWeather(15.1234, 76.5432);
        } catch (err) {
            cooldownError = err;
        }
        test('Active 429 cooldown rejects request without firing upstream call', () => {
            assert(cooldownError !== null, 'Throws during cooldown');
            assert(cooldownError.message.includes('Status: 429'), 'Includes 429 status');
        });

        // 5. Stale Fallback During Active 429 Cooldown
        _setWeatherCacheEntry(15.1234, 76.5432, {
            data: { temperature: 30, humidity: 45, rainfall: null, rainfall_status: 'not_aligned' },
            cachedAt: Date.now() - (15 * 60 * 1000), // 15 min old
            expiresAt: Date.now() - (5 * 60 * 1000)  // expired fresh TTL
        });

        const cooldownStaleResult = await getCurrentWeather(15.1234, 76.5432);
        test('Active 429 cooldown serves valid stale cache (<= 60m) instead of failing', () => {
            assert.strictEqual(cooldownStaleResult.temperature, 30);
            assert.strictEqual(cooldownStaleResult.humidity, 45);
        });

        // 6. Concurrent Identical Requests In-Flight Deduplication
        _resetWeatherState();
        let upstreamCallCount = 0;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => {
            upstreamCallCount++;
            await new Promise(r => setTimeout(r, 50));
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    current: {
                        temperature_2m: 21.0,
                        relative_humidity_2m: 78
                    }
                })
            };
        };

        try {
            const [c1, c2, c3] = await Promise.all([
                getCurrentWeather(20.5937, 78.9629),
                getCurrentWeather(20.5937, 78.9629),
                getCurrentWeather(20.5940, 78.9630) // rounds to same 20.59, 78.96
            ]);
            test('Concurrent identical requests deduplicate to single upstream call', () => {
                assert.strictEqual(upstreamCallCount, 1, 'Only one upstream fetch was executed');
                assert.strictEqual(c1.temperature, 21.0);
                assert.strictEqual(c2.temperature, 21.0);
                assert.strictEqual(c3.temperature, 21.0);
            });
        } finally {
            globalThis.fetch = originalFetch;
        }

        // 7. Retry-After Header Parsing and Default Cooldown
        _resetWeatherState();
        globalThis.fetch = async (url) => {
            return {
                ok: false,
                status: 429,
                headers: {
                    get: (h) => (h.toLowerCase() === 'retry-after' ? '120' : null)
                },
                json: async () => ({ error: true, reason: 'Hourly limit exceeded' })
            };
        };

        try {
            await getCurrentWeather(12.34, 56.78);
        } catch (_) {}

        test('Reads Retry-After header and sets rateLimitBackoffUntil appropriately', () => {
            const backoff = _getRateLimitBackoffUntil();
            const expectedMin = Date.now() + (115 * 1000);
            assert(backoff >= expectedMin, 'Backoff set to at least 115s in future based on Retry-After: 120');
        });

        // Default Cooldown (60s) when Retry-After is absent
        _resetWeatherState();
        globalThis.fetch = async (url) => {
            return {
                ok: false,
                status: 429,
                headers: {
                    get: () => null
                },
                json: async () => ({ error: true, reason: 'Too many requests' })
            };
        };

        try {
            await getCurrentWeather(12.34, 56.78);
        } catch (_) {}

        test('Defaults to 60-second cooldown when Retry-After header is absent', () => {
            const backoff = _getRateLimitBackoffUntil();
            const expectedMin = Date.now() + (55 * 1000);
            assert(backoff >= expectedMin, 'Backoff defaults to 60s in future');
        });

        // 8. Controller Response Sanitization under 429 Cooldown
        _resetWeatherState();
        _setRateLimitCooldown(Date.now() + 60000);

        const resMock = createMockRes();
        await getWeather({ query: { latitude: '9.99', longitude: '9.99' } }, resMock, () => {});

        test('Weather controller converts 429 cooldown into generic HTTP 503 response', () => {
            assert.strictEqual(resMock.statusCode, 503);
            assert.strictEqual(resMock.body.success, false);
            assert.strictEqual(resMock.body.message, 'Weather service is currently unavailable.');
            assert(!JSON.stringify(resMock.body).includes('429'), 'Never exposes 429 status code to client');
            assert(!JSON.stringify(resMock.body).includes('cooldown'), 'Never exposes internal cooldown message to client');
        });

        // 9. Retry-After Format Unit Tests (seconds, HTTP-date, invalid, cap)
        test('parseRetryAfter parses delay-seconds correctly', () => {
            assert.strictEqual(parseRetryAfter('120'), 120);
            assert.strictEqual(parseRetryAfter('  45 '), 45);
        });

        test('parseRetryAfter caps delay-seconds at 1 hour (3600s)', () => {
            assert.strictEqual(parseRetryAfter('7200'), 3600);
            assert.strictEqual(parseRetryAfter('86400'), 3600);
        });

        test('parseRetryAfter parses future HTTP-date correctly', () => {
            const futureDateStr = new Date(Date.now() + 180 * 1000).toUTCString();
            const parsed = parseRetryAfter(futureDateStr);
            assert(parsed >= 170 && parsed <= 181, `Expected ~180s, got ${parsed}`);
        });

        test('parseRetryAfter caps future HTTP-date at 1 hour (3600s)', () => {
            const farFutureDateStr = new Date(Date.now() + 7200 * 1000).toUTCString();
            const parsed = parseRetryAfter(farFutureDateStr);
            assert.strictEqual(parsed, 3600);
        });

        test('parseRetryAfter falls back to 60s for past HTTP-date or invalid string', () => {
            const pastDateStr = new Date(Date.now() - 60 * 1000).toUTCString();
            assert.strictEqual(parseRetryAfter(pastDateStr), 60);
            assert.strictEqual(parseRetryAfter('invalid-date'), 60);
            assert.strictEqual(parseRetryAfter(''), 60);
            assert.strictEqual(parseRetryAfter(null), 60);
            assert.strictEqual(parseRetryAfter(undefined), 60);
            assert.strictEqual(parseRetryAfter('-30'), 60);
        });

        // 10. HTTP-Date Retry-After Integration with 429 Cooldown
        _resetWeatherState();
        const futureDateHeader = new Date(Date.now() + 90 * 1000).toUTCString();
        const origFetchDate = globalThis.fetch;
        globalThis.fetch = async () => ({
            ok: false,
            status: 429,
            headers: {
                get: (h) => (h.toLowerCase() === 'retry-after' ? futureDateHeader : null)
            },
            json: async () => ({ error: true, reason: 'Rate limited via HTTP-date' })
        });

        try {
            await getCurrentWeather(1.23, 4.56);
        } catch (_) {}
        globalThis.fetch = origFetchDate;

        test('Sets cooldown correctly from HTTP-date Retry-After response', () => {
            const backoff = _getRateLimitBackoffUntil();
            const expectedMin = Date.now() + (80 * 1000);
            assert(backoff >= expectedMin, 'Cooldown set to at least 80s in future');
        });

        // 11. Bounded Cache Eviction at Max Capacity (500 Entries)
        _resetWeatherState();
        assert.strictEqual(_MAX_CACHE_ENTRIES, 500);

        // Pre-populate 500 unique entries
        for (let i = 0; i < 500; i++) {
            const latKey = (-50 + i * 0.1).toFixed(2);
            _setWeatherCacheEntry(latKey, '0.00', {
                data: mockWeather,
                cachedAt: Date.now(),
                expiresAt: Date.now() + (20 * 60 * 1000)
            });
        }

        test('Cache size reaches capacity limit of 500 entries', () => {
            assert.strictEqual(_getWeatherCacheSize(), 500);
        });

        // Insert 501st entry
        _setWeatherCacheEntry('45.00', '45.00', {
            data: mockWeather,
            cachedAt: Date.now(),
            expiresAt: Date.now() + (20 * 60 * 1000)
        });

        test('Cache size is capped and does not exceed 500 entries', () => {
            assert.strictEqual(_getWeatherCacheSize(), 500);
        });

        test('Oldest entry (-50.00, 0.00) was evicted when capacity was reached', async () => {
            let evictedMiss = false;
            try {
                // Base URL is 127.0.0.1:1; if evicted, it attempts fetch and throws
                await getCurrentWeather(-50.00, 0.00);
            } catch (_) {
                evictedMiss = true;
            }
            assert.strictEqual(evictedMiss, true, 'Evicted key misses cache and fails upstream');
        });

        test('Newest entry (45.00, 45.00) is preserved in cache', async () => {
            const newestResult = await getCurrentWeather(45.00, 45.00);
            assert.strictEqual(newestResult.temperature, mockWeather.temperature);
        });

    } finally {
        _resetWeatherState();
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
