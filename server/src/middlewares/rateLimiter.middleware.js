/**
 * server/src/middlewares/rateLimiter.middleware.js
 * ---------------------------------------------------------------------------
 * Authentication Endpoint Rate Limiting Middleware (Step 24.14 / GAP-17)
 *
 * Implements sliding-window in-memory rate limiting to protect authentication
 * endpoints (POST /login, POST /register) against automated credential stuffing
 * and brute-force password guessing attacks.
 *
 * Architecture & Design Decisions:
 *   - Zero external dependencies: Self-contained, robust in-memory sliding window.
 *   - Strict IP resolution: Uses Express `req.ip` which respects `trust proxy`
 *     configuration without blindly trusting arbitrary client X-Forwarded-For headers.
 *   - Automatic garbage collection: Periodically prunes expired timestamps to
 *     prevent unbounded memory growth over long-running processes.
 *   - Zero credential logging: Only logs client IP on rate violation in non-production.
 *     Never accesses or logs passwords, tokens, or email bodies.
 *   - Standard RFC HTTP headers: Sets `Retry-After`, `RateLimit-Limit`,
 *     `RateLimit-Remaining`, and `RateLimit-Reset` on responses.
 *
 * Distributed Cluster Limitations:
 *   This is an in-memory rate limiter stored within the single Node.js process heap.
 *   In a horizontally scaled deployment with multiple server instances behind a
 *   load balancer without sticky sessions, each instance maintains its own memory store.
 *   For multi-replica deployments, a distributed store (e.g. Redis / Memcached)
 *   should be configured to synchronize state across replicas.
 * ---------------------------------------------------------------------------
 */

export const createRateLimiter = (options = {}) => {
    const getWindowMs = () => {
        if (typeof options.windowMs === 'number') {
            return options.windowMs;
        }
        if (process.env.AUTH_RATE_LIMIT_WINDOW_MS) {
            return parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10);
        }
        return 15 * 60 * 1000; // 15 minutes default
    };

    const getMaxRequests = () => {
        if (typeof options.maxRequests === 'number') {
            return options.maxRequests;
        }
        if (process.env.AUTH_RATE_LIMIT_MAX) {
            return parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10);
        }
        return process.env.NODE_ENV === 'development' ? 100 : 10; // 100 in dev demo, 10 in production
    };

    const message = options.message || 'Too many authentication attempts. Please try again later.';

    // In-memory request timestamp store: Map<string, number[]>
    const hits = new Map();

    // Automatic periodic cleanup of expired entries
    const cleanupInterval = Math.max(getWindowMs() / 2, 60000);
    const timer = setInterval(() => {
        const now = Date.now();
        const windowMs = getWindowMs();
        for (const [key, timestamps] of hits.entries()) {
            const valid = timestamps.filter(t => now - t < windowMs);
            if (valid.length === 0) {
                hits.delete(key);
            } else {
                hits.set(key, valid);
            }
        }
    }, cleanupInterval);

    // Prevent interval from blocking Node.js process exit
    if (timer.unref) {
        timer.unref();
    }

    const limiter = (req, res, next) => {
        const windowMs = getWindowMs();
        const maxRequests = getMaxRequests();

        // Resolve client IP (respects Express req.ip and trust proxy configuration)
        const rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';

        // Partition buckets by route so registration and login do not exhaust each other's quota
        let routePrefix = '';
        if (options.partitionByRoute !== false) {
            if (options.routePrefix) {
                routePrefix = options.routePrefix;
            } else if (req.baseUrl || req.path || req.originalUrl) {
                routePrefix = req.baseUrl && req.path
                    ? `${req.baseUrl}${req.path}`
                    : (req.path || req.originalUrl?.split('?')[0] || '');
            }
        }
        const clientKey = routePrefix ? `${routePrefix}:${rawIp}` : rawIp;
        const now = Date.now();

        let timestamps = hits.get(clientKey) || [];
        // Filter out expired timestamps outside the sliding window
        timestamps = timestamps.filter(t => now - t < windowMs);

        if (timestamps.length >= maxRequests) {
            const oldest = timestamps[0];
            const retryAfterMs = oldest + windowMs - now;
            const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
            const resetTime = Math.ceil((oldest + windowMs) / 1000);

            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('RateLimit-Limit', maxRequests);
            res.setHeader('RateLimit-Remaining', 0);
            res.setHeader('RateLimit-Reset', resetTime);
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', resetTime);

            return res.status(429).json({
                success: false,
                message: `${message} (Retry after ${retryAfterSec} seconds)`,
                retryAfter: retryAfterSec
            });
        }

        // Record request timestamp
        timestamps.push(now);
        hits.set(clientKey, timestamps);

        const remaining = Math.max(0, maxRequests - timestamps.length);
        const resetTime = Math.ceil((timestamps[0] + windowMs) / 1000);

        res.setHeader('RateLimit-Limit', maxRequests);
        res.setHeader('RateLimit-Remaining', remaining);
        res.setHeader('RateLimit-Reset', resetTime);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetTime);

        if (typeof next === 'function') {
            next();
        }
    };

    // Helper method to reset state during unit tests or administrative actions
    limiter.reset = (key) => {
        if (key) {
            hits.delete(key);
            for (const k of hits.keys()) {
                if (k.endsWith(`:${key}`)) {
                    hits.delete(k);
                }
            }
        } else {
            hits.clear();
        }
    };

    // Helper method to destroy cleanup timer
    limiter.close = () => {
        clearInterval(timer);
    };

    // Helper to get current hit count for an IP or key (for tests and monitoring)
    limiter.getHits = (key) => {
        const windowMs = getWindowMs();
        if (hits.has(key)) {
            const timestamps = hits.get(key) || [];
            const now = Date.now();
            return timestamps.filter(t => now - t < windowMs).length;
        }
        let total = 0;
        const now = Date.now();
        for (const [k, timestamps] of hits.entries()) {
            if (k === key || k.endsWith(`:${key}`)) {
                total += timestamps.filter(t => now - t < windowMs).length;
            }
        }
        return total;
    };

    return limiter;
};

// Default singleton instance configured for authentication routes
export const authRateLimiter = createRateLimiter();
