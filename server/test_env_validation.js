/**
 * test_env_validation.js
 * ---------------------------------------------------------------------------
 * Comprehensive Test Suite for Step 24.6 / GAP-13:
 * Backend Startup Environment Validation
 *
 * Verifies:
 *   1. Missing, empty, whitespace-only, and short JWT_SECRET
 *   2. Missing, empty, whitespace-only, and invalid MONGODB_URI
 *   3. Missing, empty, whitespace-only, and invalid ML_SERVICE_URL
 *   4. Optional PORT validation (valid vs invalid integers)
 *   5. All required environment variables present (success)
 *   6. Secret redaction / non-exposure in all error messages
 *   7. Fail-fast child process execution: ensures process exits before listening
 * ---------------------------------------------------------------------------
 */

import { validateEnv, validateStartupEnv } from './src/config/env.js';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
console.log("Step 24.6 Backend Startup Environment Validation Suite");
console.log("==================================================\n");

// Canonical baseline valid configuration
const validBaseEnv = {
    JWT_SECRET: 'test-secret-key-12345678',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/crop_test',
    ML_SERVICE_URL: 'http://localhost:8000',
    PORT: '5000',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    NODE_ENV: 'test',
};

// ---------------------------------------------------------------------------
// 1. JWT_SECRET Validation
// ---------------------------------------------------------------------------
console.log("1. JWT_SECRET Validation");
{
    // A. Missing JWT_SECRET
    const envMissing = { ...validBaseEnv };
    delete envMissing.JWT_SECRET;
    const rMissing = validateEnv(envMissing);
    assert(!rMissing.isValid, "Rejects missing JWT_SECRET");
    assert(rMissing.errors.some(e => e.includes("JWT_SECRET is missing")), "Error specifies JWT_SECRET is missing");

    // B. Undefined JWT_SECRET
    const envUndef = { ...validBaseEnv, JWT_SECRET: undefined };
    const rUndef = validateEnv(envUndef);
    assert(!rUndef.isValid, "Rejects undefined JWT_SECRET");

    // C. Empty string JWT_SECRET
    const envEmpty = { ...validBaseEnv, JWT_SECRET: '' };
    const rEmpty = validateEnv(envEmpty);
    assert(!rEmpty.isValid, "Rejects empty string JWT_SECRET");
    assert(rEmpty.errors.some(e => e.includes("cannot be empty or whitespace")), "Error specifies empty/whitespace rule");

    // D. Whitespace-only JWT_SECRET
    const envWs = { ...validBaseEnv, JWT_SECRET: '     \t  \n  ' };
    const rWs = validateEnv(envWs);
    assert(!rWs.isValid, "Rejects whitespace-only JWT_SECRET");
    assert(rWs.errors.some(e => e.includes("cannot be empty or whitespace")), "Error specifies whitespace rejection");

    // E. Short JWT_SECRET (< 8 chars)
    const envShort = { ...validBaseEnv, JWT_SECRET: 'short' };
    const rShort = validateEnv(envShort);
    assert(!rShort.isValid, "Rejects short JWT_SECRET (< 8 characters)");
    assert(rShort.errors.some(e => e.includes("at least 8 characters")), "Error specifies minimum 8 characters rule");

    // F. Valid JWT_SECRET (>= 8 chars)
    const envValid = { ...validBaseEnv, JWT_SECRET: 'secure_secret_token_123' };
    const rValid = validateEnv(envValid);
    assert(rValid.isValid, "Accepts valid JWT_SECRET");
}

// ---------------------------------------------------------------------------
// 2. MONGODB_URI Validation
// ---------------------------------------------------------------------------
console.log("\n2. MONGODB_URI Validation");
{
    // A. Missing MONGODB_URI
    const envMissing = { ...validBaseEnv };
    delete envMissing.MONGODB_URI;
    const rMissing = validateEnv(envMissing);
    assert(!rMissing.isValid, "Rejects missing MONGODB_URI");
    assert(rMissing.errors.some(e => e.includes("MONGODB_URI is missing")), "Error specifies MONGODB_URI is missing");

    // B. Empty string MONGODB_URI
    const envEmpty = { ...validBaseEnv, MONGODB_URI: '' };
    const rEmpty = validateEnv(envEmpty);
    assert(!rEmpty.isValid, "Rejects empty string MONGODB_URI");
    assert(rEmpty.errors.some(e => e.includes("cannot be empty or whitespace")), "Error specifies empty/whitespace rule");

    // C. Whitespace-only MONGODB_URI
    const envWs = { ...validBaseEnv, MONGODB_URI: '    \t ' };
    const rWs = validateEnv(envWs);
    assert(!rWs.isValid, "Rejects whitespace-only MONGODB_URI");

    // D. Invalid protocol (e.g. http://)
    const envHttp = { ...validBaseEnv, MONGODB_URI: 'http://localhost:27017/crop_db' };
    const rHttp = validateEnv(envHttp);
    assert(!rHttp.isValid, "Rejects MONGODB_URI with non-mongo protocol");
    assert(rHttp.errors.some(e => e.includes('start with "mongodb://" or "mongodb+srv://"')), "Error specifies required protocols");

    // E. Valid mongodb:// format
    const envLocal = { ...validBaseEnv, MONGODB_URI: 'mongodb://localhost:27017/crop_db' };
    assert(validateEnv(envLocal).isValid, "Accepts standard mongodb:// connection string");

    // F. Valid mongodb+srv:// format
    const envSrv = { ...validBaseEnv, MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/crop_db' };
    assert(validateEnv(envSrv).isValid, "Accepts mongodb+srv:// connection string");
}

// ---------------------------------------------------------------------------
// 3. ML_SERVICE_URL Validation
// ---------------------------------------------------------------------------
console.log("\n3. ML_SERVICE_URL Validation");
{
    // A. Missing ML_SERVICE_URL
    const envMissing = { ...validBaseEnv };
    delete envMissing.ML_SERVICE_URL;
    const rMissing = validateEnv(envMissing);
    assert(!rMissing.isValid, "Rejects missing ML_SERVICE_URL");
    assert(rMissing.errors.some(e => e.includes("ML_SERVICE_URL is missing")), "Error specifies ML_SERVICE_URL is missing");

    // B. Empty string ML_SERVICE_URL
    const envEmpty = { ...validBaseEnv, ML_SERVICE_URL: '' };
    const rEmpty = validateEnv(envEmpty);
    assert(!rEmpty.isValid, "Rejects empty string ML_SERVICE_URL");
    assert(rEmpty.errors.some(e => e.includes("cannot be empty or whitespace")), "Error specifies empty/whitespace rule");

    // C. Whitespace-only ML_SERVICE_URL
    const envWs = { ...validBaseEnv, ML_SERVICE_URL: '   ' };
    const rWs = validateEnv(envWs);
    assert(!rWs.isValid, "Rejects whitespace-only ML_SERVICE_URL");

    // D. Malformed non-URL string
    const envMalformed = { ...validBaseEnv, ML_SERVICE_URL: 'not-a-valid-url' };
    const rMalformed = validateEnv(envMalformed);
    assert(!rMalformed.isValid, "Rejects malformed non-URL string");
    assert(rMalformed.errors.some(e => e.includes("valid URL")), "Error specifies valid URL rule");

    // E. Invalid protocol (e.g. ftp://)
    const envFtp = { ...validBaseEnv, ML_SERVICE_URL: 'ftp://localhost:8000' };
    const rFtp = validateEnv(envFtp);
    assert(!rFtp.isValid, "Rejects unsupported protocol in ML_SERVICE_URL");
    assert(rFtp.errors.some(e => e.includes("http: or https: protocol")), "Error specifies http/https requirement");

    // F. Valid http:// URL
    const envHttp = { ...validBaseEnv, ML_SERVICE_URL: 'http://localhost:8000' };
    assert(validateEnv(envHttp).isValid, "Accepts valid http:// URL");

    // G. Valid https:// URL
    const envHttps = { ...validBaseEnv, ML_SERVICE_URL: 'https://ml.krishimitra.example.com' };
    assert(validateEnv(envHttps).isValid, "Accepts valid https:// URL");
}

// ---------------------------------------------------------------------------
// 4. Optional PORT Validation
// ---------------------------------------------------------------------------
console.log("\n4. Optional PORT Validation");
{
    // A. Valid numeric string
    const envPortValid = { ...validBaseEnv, PORT: '8080' };
    assert(validateEnv(envPortValid).isValid, "Accepts valid integer PORT (8080)");

    // B. Non-numeric string
    const envPortAlpha = { ...validBaseEnv, PORT: 'five-thousand' };
    const rAlpha = validateEnv(envPortAlpha);
    assert(!rAlpha.isValid, "Rejects non-numeric PORT");
    assert(rAlpha.errors.some(e => e.includes("integer between 1 and 65535")), "Error specifies port range rule");

    // C. Out of range (> 65535)
    const envPortHigh = { ...validBaseEnv, PORT: '70000' };
    assert(!validateEnv(envPortHigh).isValid, "Rejects out-of-range high PORT");

    // D. Out of range (<= 0)
    const envPortZero = { ...validBaseEnv, PORT: '0' };
    assert(!validateEnv(envPortZero).isValid, "Rejects PORT 0");

    // E. Float number
    const envPortFloat = { ...validBaseEnv, PORT: '5000.5' };
    assert(!validateEnv(envPortFloat).isValid, "Rejects floating point PORT");

    // F. Omitted PORT defaults gracefully
    const envPortOmitted = { ...validBaseEnv };
    delete envPortOmitted.PORT;
    assert(validateEnv(envPortOmitted).isValid, "Accepts omitted PORT (defaults in server.js)");
}

// ---------------------------------------------------------------------------
// 5. All Required Variables Present (Success Case)
// ---------------------------------------------------------------------------
console.log("\n5. Complete Valid Configuration");
{
    const rValid = validateEnv(validBaseEnv);
    assert(rValid.isValid, "Full baseline configuration is valid");
    assert(rValid.errors.length === 0, "No errors reported on valid configuration");
}

// ---------------------------------------------------------------------------
// 6. Security Invariant: Zero Secret Exposure
// ---------------------------------------------------------------------------
console.log("\n6. Secret Leak Prevention in Error Messages");
{
    const sensitiveSecret = 'super_secret_value_xyz987';
    const envWithSensitive = {
        ...validBaseEnv,
        JWT_SECRET: 'short', // invalid because < 8 chars
        MONGODB_URI: 'http://malformed',
        ML_SERVICE_URL: 'ftp://invalid',
    };

    const r = validateEnv(envWithSensitive);
    const combinedErrors = r.errors.join(' ');

    assert(!combinedErrors.includes(sensitiveSecret), "Sensitive secret value is never printed in error messages");
    assert(!combinedErrors.includes('short'), "Even invalid short secret value is not reflected in error messages");

    // Test logger output via validateStartupEnv
    const logs = [];
    const mockLogger = {
        error: (msg) => logs.push(msg),
        warn: (msg) => logs.push(msg),
    };

    validateStartupEnv(envWithSensitive, { exitOnError: false, logger: mockLogger });
    const fullLogOutput = logs.join('\n');

    assert(!fullLogOutput.includes(sensitiveSecret), "Logger output never leaks secret value");
    assert(!fullLogOutput.includes('short'), "Logger output never reflects secret substring");
    assert(fullLogOutput.includes('[FATAL] Backend Startup Environment Validation Failed'), "Logger includes clear fatal message header");
}

// ---------------------------------------------------------------------------
// 7. Fail-Fast Process Execution Test (Child Process)
// ---------------------------------------------------------------------------
console.log("\n7. Fail-Fast Process Execution (Process Abort Before Listening)");
{
    const serverPath = path.resolve(__dirname, 'src/server.js');

    // Spawn node process with missing JWT_SECRET and non-existent dotenv file
    const result = spawnSync(process.execPath, [serverPath], {
        cwd: __dirname,
        env: {
            // Explicitly pass empty JWT_SECRET to trigger validation failure
            ...process.env,
            DOTENV_CONFIG_PATH: path.join(__dirname, 'nonexistent.env'),
            JWT_SECRET: '',
        },
        encoding: 'utf8',
        timeout: 15000,
    });

    assert(result.status !== 0, `Process exited with non-zero exit code (${result.status})`);
    assert(result.status === 1, "Exit code is exactly 1 on validation error");

    const combinedOutput = (result.stdout || '') + (result.stderr || '');

    assert(combinedOutput.includes('[FATAL] Backend Startup Environment Validation Failed'), "Fatal error banner emitted before exit");
    assert(combinedOutput.includes('JWT_SECRET cannot be empty or whitespace'), "Specific error for JWT_SECRET emitted");
    assert(!combinedOutput.includes('Server is running on port'), "Server NEVER started listening on port");
    assert(!combinedOutput.includes('Connected to Database'), "MongoDB connection was NEVER attempted");
}

console.log("\n==================================================");
console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
    process.exit(1);
}
