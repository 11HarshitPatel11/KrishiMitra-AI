/**
 * client/src/config/api.config.js
 * ---------------------------------------------------------------------------
 * KrishiMitra AI — Centralized Frontend API Configuration Module (Step 24.14 / GAP-16)
 *
 * Provides a single, centralized API base URL for all client service modules.
 *
 * Configuration Precedence:
 *   1. import.meta.env.VITE_API_URL (if provided and non-empty)
 *   2. process.env.VITE_API_URL (fallback for Node / test runner environments)
 *   3. http://localhost:5000/api/v1 (default development fallback)
 *
 * Security Notice:
 * Vite variables prefixed with `VITE_` are injected directly into public client-side
 * browser bundles during build time. NEVER store private API keys, database credentials,
 * or secret tokens in `VITE_` variables or client-side `.env` files.
 * ---------------------------------------------------------------------------
 */

export const getApiBaseUrl = () => {
    let raw = '';
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        raw = import.meta.env.VITE_API_URL;
    } else if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
        raw = process.env.VITE_API_URL;
    }

    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
        // Strip trailing slashes to guarantee clean endpoint concatenation
        return raw.trim().replace(/\/+$/, '');
    }

    return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();
