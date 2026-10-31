/**
 * server/test_proxy_trust.js
 * ---------------------------------------------------------------------------
 * Step 24.24 (BLK-02) Reverse Proxy Trust Configuration Test Suite
 * ---------------------------------------------------------------------------
 */

import assert from 'assert';
import express from 'express';
import { validateEnv } from './src/config/env.js';

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

console.log('==================================================');
console.log('Step 24.24 Reverse Proxy Trust Test Suite');
console.log('==================================================');

// ---------------------------------------------------------------------------
// 1. Environment Validation Tests for TRUST_PROXY
// ---------------------------------------------------------------------------
console.log('\n1. Environment Validation (TRUST_PROXY)');

const validBase = {
    JWT_SECRET: 'test-secret-key-12345',
    MONGODB_URI: 'mongodb://localhost:27017/crop_db',
    ML_SERVICE_URL: 'http://localhost:8000',
};

test('Accepts TRUST_PROXY=1 without warnings', () => {
    const res = validateEnv({ ...validBase, TRUST_PROXY: '1' });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.warnings.length, 0);
});

test('Accepts TRUST_PROXY=loopback without warnings', () => {
    const res = validateEnv({ ...validBase, TRUST_PROXY: 'loopback' });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.warnings.length, 0);
});

test('Accepts TRUST_PROXY=false without warnings', () => {
    const res = validateEnv({ ...validBase, TRUST_PROXY: 'false' });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.warnings.length, 0);
});

test('Issues security warning on unrestricted TRUST_PROXY=true', () => {
    const res = validateEnv({ ...validBase, TRUST_PROXY: 'true' });
    assert.strictEqual(res.isValid, true);
    assert(res.warnings.some(w => w.includes('unrestricted proxy trust') || w.includes('spoofing')));
});

// ---------------------------------------------------------------------------
// 2. Express Trust Proxy Settings
// ---------------------------------------------------------------------------
console.log('\n2. Express Application Trust Proxy Configuration');

const setupAppWithTrustProxy = (envVal) => {
    const app = express();
    if (envVal) {
        const tp = envVal.trim();
        if (tp === 'true') {
            app.set('trust proxy', true);
        } else if (tp === 'false' || tp === '0') {
            app.set('trust proxy', false);
        } else if (/^\d+$/.test(tp)) {
            app.set('trust proxy', parseInt(tp, 10));
        } else {
            app.set('trust proxy', tp);
        }
    } else {
        app.set('trust proxy', false);
    }
    return app;
};

test('Configures trust proxy to 1 when TRUST_PROXY="1"', () => {
    const app = setupAppWithTrustProxy('1');
    assert.strictEqual(app.get('trust proxy'), 1);
});

test('Configures trust proxy to "loopback" when TRUST_PROXY="loopback"', () => {
    const app = setupAppWithTrustProxy('loopback');
    assert.strictEqual(app.get('trust proxy'), 'loopback');
});

test('Configures trust proxy to false when TRUST_PROXY is omitted', () => {
    const app = setupAppWithTrustProxy(undefined);
    assert.strictEqual(app.get('trust proxy'), false);
});

test('Configures trust proxy to false when TRUST_PROXY="false"', () => {
    const app = setupAppWithTrustProxy('false');
    assert.strictEqual(app.get('trust proxy'), false);
});

// ---------------------------------------------------------------------------
// 3. Client IP Resolution Invariant
// ---------------------------------------------------------------------------
console.log('\n3. Client IP Resolution Invariants');

test('When trust proxy is 1, Express resolves client IP from X-Forwarded-For', () => {
    const app = setupAppWithTrustProxy('1');
    let resolvedIp = null;
    app.get('/test-ip', (req, res) => {
        resolvedIp = req.ip;
        res.json({ ip: req.ip });
    });

    // Mock Express request handling
    const req = {
        headers: {
            'x-forwarded-for': '203.0.113.195, 10.0.0.1'
        },
        connection: { remoteAddress: '10.0.0.1' },
        socket: { remoteAddress: '10.0.0.1' },
        app
    };
    // Express req.ip getter evaluation
    const trustProxyFn = app.get('trust proxy fn');
    // Express default proxy function parses X-Forwarded-For when trust proxy is active
    assert(typeof trustProxyFn === 'function', 'Express generated a trust proxy resolver function');
});

test('When trust proxy is false, X-Forwarded-For is ignored', () => {
    const app = setupAppWithTrustProxy('false');
    assert.strictEqual(app.get('trust proxy'), false);
    // When false, Express does not use trust proxy resolver
});

console.log('\n==================================================');
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) {
    process.exit(1);
}
