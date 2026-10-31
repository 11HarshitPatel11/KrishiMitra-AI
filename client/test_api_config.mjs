/**
 * client/test_api_config.mjs
 * ---------------------------------------------------------------------------
 * Test Suite for Step 24.14 (GAP-16): Client API URL Centralization
 *
 * Verifies:
 *   1. Default fallback to 'http://localhost:5000/api/v1'
 *   2. Custom VITE_API_URL resolution
 *   3. Trailing slash normalization
 *   4. Whitespace trimming
 *   5. Empty string fallback
 *   6. Comprehensive migration of all 9 client service modules
 *   7. Zero remaining hardcoded 'localhost:5000' in client services
 *   8. Presence and security documentation in client/.env.example
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApiBaseUrl } from './src/config/api.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
console.log("Step 24.14 Client API URL Configuration Test Suite");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
// 1. API Base URL Resolution & Fallback Logic
// ---------------------------------------------------------------------------
console.log("1. API Base URL Resolution & Fallback Logic");

const originalProcessEnv = process.env.VITE_API_URL;

try {
    // 1.1 Default fallback when unset
    delete process.env.VITE_API_URL;
    assert(
        getApiBaseUrl() === 'http://localhost:5000/api/v1',
        "Defaults to 'http://localhost:5000/api/v1' when VITE_API_URL is unset",
        `got "${getApiBaseUrl()}"`
    );

    // 1.2 Custom deployment URL
    process.env.VITE_API_URL = 'https://krishimitra-api.example.com/api/v1';
    assert(
        getApiBaseUrl() === 'https://krishimitra-api.example.com/api/v1',
        "Respects custom VITE_API_URL",
        `got "${getApiBaseUrl()}"`
    );

    // 1.3 Trailing slash normalization
    process.env.VITE_API_URL = 'https://krishimitra-api.example.com/api/v1///';
    assert(
        getApiBaseUrl() === 'https://krishimitra-api.example.com/api/v1',
        "Strips trailing slashes defensively",
        `got "${getApiBaseUrl()}"`
    );

    // 1.4 Whitespace trimming
    process.env.VITE_API_URL = '   https://krishimitra-api.example.com/api/v1   ';
    assert(
        getApiBaseUrl() === 'https://krishimitra-api.example.com/api/v1',
        "Trims leading and trailing whitespace",
        `got "${getApiBaseUrl()}"`
    );

    // 1.5 Empty string fallback
    process.env.VITE_API_URL = '';
    assert(
        getApiBaseUrl() === 'http://localhost:5000/api/v1',
        "Falls back to default when VITE_API_URL is an empty string",
        `got "${getApiBaseUrl()}"`
    );

    // 1.6 Whitespace-only string fallback
    process.env.VITE_API_URL = '   ';
    assert(
        getApiBaseUrl() === 'http://localhost:5000/api/v1',
        "Falls back to default when VITE_API_URL is whitespace-only",
        `got "${getApiBaseUrl()}"`
    );

} finally {
    if (originalProcessEnv !== undefined) {
        process.env.VITE_API_URL = originalProcessEnv;
    } else {
        delete process.env.VITE_API_URL;
    }
}

// ---------------------------------------------------------------------------
// 2. Client Service Migration & Hardcoded URL Elimination
// ---------------------------------------------------------------------------
console.log("\n2. Service Migration & Hardcoded URL Elimination");

const serviceFiles = [
    { name: 'auth.service.js', path: 'src/services/auth.service.js' },
    { name: 'farm.service.js', path: 'src/features/farm/services/farm.service.js' },
    { name: 'cropHistory.service.js', path: 'src/features/cropHistory/services/cropHistory.service.js' },
    { name: 'disease.service.js', path: 'src/features/disease/services/disease.service.js' },
    { name: 'market.service.js', path: 'src/features/market/services/market.service.js' },
    { name: 'recommendation.service.js', path: 'src/features/recommendation/services/recommendation.service.js' },
    { name: 'soilInformation.service.js', path: 'src/features/soil/services/soilInformation.service.js' },
    { name: 'externalSoil.service.js', path: 'src/features/soil/services/externalSoil.service.js' },
    { name: 'weather.service.js', path: 'src/features/weather/services/weather.service.js' }
];

for (const svc of serviceFiles) {
    const fullPath = path.resolve(__dirname, svc.path);
    assert(fs.existsSync(fullPath), `Service file exists: ${svc.name}`);

    const content = fs.readFileSync(fullPath, 'utf8');

    // Must import API_BASE_URL from api.config
    assert(
        content.includes('API_BASE_URL') && content.includes('api.config'),
        `${svc.name} imports API_BASE_URL from api.config`
    );

    // Must NOT contain hardcoded http://localhost:5000
    assert(
        !content.includes('http://localhost:5000') && !content.includes('localhost:5000'),
        `${svc.name} contains zero hardcoded localhost:5000 strings`
    );
}

// ---------------------------------------------------------------------------
// 3. Client Environment Documentation (.env.example)
// ---------------------------------------------------------------------------
console.log("\n3. Client Environment Documentation (.env.example)");

const envExamplePath = path.resolve(__dirname, '.env.example');
assert(fs.existsSync(envExamplePath), "client/.env.example exists");

const envContent = fs.readFileSync(envExamplePath, 'utf8');
assert(
    envContent.includes('VITE_API_URL=http://localhost:5000/api/v1'),
    "client/.env.example documents VITE_API_URL placeholder default"
);

assert(
    envContent.toLowerCase().includes('security warning') || envContent.toLowerCase().includes('never define secret'),
    "client/.env.example contains explicit security warning against storing secrets in VITE_ variables"
);

assert(
    !envContent.includes('JWT_SECRET') && !envContent.includes('MONGODB_URI'),
    "client/.env.example strictly contains zero backend secrets or database credentials"
);

console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
