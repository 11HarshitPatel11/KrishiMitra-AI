/**
 * server/src/middlewares/error.middleware.js
 * ---------------------------------------------------------------------------
 * KrishiMitra AI — Centralized API Error Handling Middleware
 *
 * Implements safe error sanitization (Step 24.24 / BLK-06):
 *   - In production (NODE_ENV === 'production'):
 *       * Masks internal error messages, stack traces, and database/system details
 *         on HTTP 500 errors, returning a safe, generic message.
 *       * Logs full error diagnostics server-side for observability and APM.
 *   - In non-production (development / test):
 *       * Returns diagnostic error messages to aid active debugging.
 *   - Preserves explicit client/business errors (HTTP 4xx):
 *       * Retains intentional messages and codes for validation, authentication,
 *         authorization, not found, conflict, and rate limiting.
 * ---------------------------------------------------------------------------
 */

export const errorHandler = (err, req, res, next) => {
    // Server-side logging for observability
    console.error('[Error]:', err.stack || err);

    // 1. Mongoose duplicate key error (HTTP 400)
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error',
            errors: [{ message: Object.keys(err.keyValue || {}).map(key => `${key} already exists`).join(', ') }]
        });
    }

    // 2. Mongoose schema validation error fallback (HTTP 400)
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors || {}).map(el => ({
            path: el.path,
            message: el.message
        }));
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // 3. Mongoose CastError for invalid ObjectIds (HTTP 400)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource identifier format',
            errors: [{ message: `Invalid ${err.path}: ${err.value}` }]
        });
    }

    // 4. Intentional client/application errors (HTTP 4xx status codes)
    const errStatus = err.statusCode || err.status;
    if (errStatus && errStatus >= 400 && errStatus < 500) {
        return res.status(errStatus).json({
            success: false,
            message: err.message,
            errors: [{ message: err.message }]
        });
    }

    // 5. Unhandled / Internal Server Errors (HTTP 500 or 5xx)
    const statusCode = (errStatus && errStatus >= 500) ? errStatus : 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, strictly sanitize error messages to prevent leakage of
    // connection strings, internal paths, query syntax, or unhandled exception details.
    const clientErrorMessage = isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : (err.message || 'Something went wrong');

    return res.status(statusCode).json({
        success: false,
        message: 'Internal server error',
        errors: [{ message: clientErrorMessage }]
    });
};
