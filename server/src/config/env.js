/**
 * server/src/config/env.js
 * ---------------------------------------------------------------------------
 * Backend Startup Environment Validation Module (Step 24.6 / GAP-13)
 *
 * Implements fail-fast validation for all required backend environment variables.
 * Enforces security and stability invariants:
 *   - Never prints or leaks secret values in error messages or logs.
 *   - Fails fast before the Express listener starts or database connects.
 *   - Validates existence, non-emptiness, and formatting rules.
 * ---------------------------------------------------------------------------
 */

/**
 * Validates the provided environment dictionary against required and optional rules.
 * Does NOT exit the process directly; returns a structured result for testability.
 *
 * @param {Record<string, string | undefined>} env - Environment variables dictionary (defaults to process.env)
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export const validateEnv = (env = process.env) => {
    const errors = [];
    const warnings = [];

    // -----------------------------------------------------------------------
    // 1. JWT_SECRET (Required)
    // -----------------------------------------------------------------------
    const jwtSecret = env.JWT_SECRET;
    if (jwtSecret === undefined || jwtSecret === null) {
        errors.push('JWT_SECRET is missing');
    } else if (typeof jwtSecret !== 'string' || jwtSecret.trim().length === 0) {
        errors.push('JWT_SECRET cannot be empty or whitespace');
    } else if (jwtSecret.trim().length < 8) {
        errors.push('JWT_SECRET must be at least 8 characters long for security');
    }

    // -----------------------------------------------------------------------
    // 2. MONGODB_URI (Required)
    // -----------------------------------------------------------------------
    const mongoUri = env.MONGODB_URI;
    if (mongoUri === undefined || mongoUri === null) {
        errors.push('MONGODB_URI is missing');
    } else if (typeof mongoUri !== 'string' || mongoUri.trim().length === 0) {
        errors.push('MONGODB_URI cannot be empty or whitespace');
    } else {
        const trimmedUri = mongoUri.trim();
        if (!trimmedUri.startsWith('mongodb://') && !trimmedUri.startsWith('mongodb+srv://')) {
            errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
        }
    }

    // -----------------------------------------------------------------------
    // 3. ML_SERVICE_URL (Required)
    // -----------------------------------------------------------------------
    const mlUrl = env.ML_SERVICE_URL;
    if (mlUrl === undefined || mlUrl === null) {
        errors.push('ML_SERVICE_URL is missing');
    } else if (typeof mlUrl !== 'string' || mlUrl.trim().length === 0) {
        errors.push('ML_SERVICE_URL cannot be empty or whitespace');
    } else {
        const trimmedUrl = mlUrl.trim();
        try {
            const parsed = new URL(trimmedUrl);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                errors.push('ML_SERVICE_URL must use http: or https: protocol');
            }
        } catch {
            errors.push('ML_SERVICE_URL must be a valid URL (e.g., http://localhost:8000)');
        }
    }

    // -----------------------------------------------------------------------
    // 4. PORT (Optional, with default 5000 in server.js)
    // -----------------------------------------------------------------------
    if (env.PORT !== undefined && env.PORT !== '') {
        const portNum = Number(env.PORT);
        if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
            errors.push('PORT must be an integer between 1 and 65535');
        }
    }

    // -----------------------------------------------------------------------
    // 5. ALLOWED_ORIGINS (Optional, with default http://localhost:3000 in app.js)
    // -----------------------------------------------------------------------
    if (env.ALLOWED_ORIGINS !== undefined && env.ALLOWED_ORIGINS !== '') {
        const origins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
        if (origins.length === 0) {
            warnings.push('ALLOWED_ORIGINS is configured but contains no valid origins');
        }
    }

    // -----------------------------------------------------------------------
    // 6. TRUST_PROXY (Optional, Step 24.24 / BLK-02)
    // -----------------------------------------------------------------------
    if (env.TRUST_PROXY !== undefined && env.TRUST_PROXY !== '') {
        const tp = env.TRUST_PROXY.trim().toLowerCase();
        if (tp === 'true') {
            warnings.push(
                "TRUST_PROXY='true' enables unrestricted proxy trust across all hops. " +
                "In production, configure exact hop count (e.g. TRUST_PROXY=1) or trusted subnet ('loopback') to prevent client IP spoofing."
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Validates the startup environment and exits with code 1 if invalid.
 * Safe logger ensures secret values are NEVER printed to stdout/stderr.
 *
 * @param {Record<string, string | undefined>} env - Defaults to process.env
 * @param {{ exitOnError?: boolean, logger?: { error: Function, warn: Function } }} options
 * @returns {boolean} True if valid, false if invalid (when exitOnError is false)
 */
export const validateStartupEnv = (env = process.env, options = {}) => {
    const exitOnError = options.exitOnError ?? true;
    const logger = options.logger ?? console;

    const result = validateEnv(env);

    if (!result.isValid) {
        logger.error('==================================================');
        logger.error('[FATAL] Backend Startup Environment Validation Failed');
        logger.error('The application cannot start due to configuration errors:');
        for (const error of result.errors) {
            logger.error(`  ❌  ${error}`);
        }
        logger.error('Please configure the required environment variables in server/.env');
        logger.error('See server/.env.example for guidance.');
        logger.error('==================================================');

        if (exitOnError) {
            process.exit(1);
        }
        return false;
    }

    if (result.warnings.length > 0 && env.NODE_ENV !== 'test') {
        for (const warning of result.warnings) {
            logger.warn(`[WARN] Startup Environment: ${warning}`);
        }
    }

    return true;
};
