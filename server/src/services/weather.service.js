const FRESH_TTL_MS = 20 * 60 * 1000;      // 20 minutes fresh TTL
const MAX_STALE_TTL_MS = 60 * 60 * 1000;   // 60 minutes max stale threshold
const DEFAULT_COOLDOWN_SEC = 60;          // 60 seconds default 429 cooldown
const MAX_COOLDOWN_SEC = 3600;            // 1 hour maximum cooldown cap
const MAX_CACHE_ENTRIES = 500;            // Maximum cache entries to prevent memory leaks

// In-memory cache: Map<string, { data: object, cachedAt: number, expiresAt: number }>
const weatherCache = new Map();

// In-flight promise tracker: Map<string, Promise<object>>
const inFlightRequests = new Map();

// Rate limit cooldown timestamp (ms since epoch)
let rateLimitBackoffUntil = 0;

export const parseRetryAfter = (headerValue) => {
    if (!headerValue || typeof headerValue !== 'string') {
        return DEFAULT_COOLDOWN_SEC;
    }
    const trimmed = headerValue.trim();
    // 1. Check if integer delay-seconds
    const parsedSec = parseInt(trimmed, 10);
    if (!isNaN(parsedSec) && parsedSec > 0 && String(parsedSec) === trimmed) {
        return Math.min(parsedSec, MAX_COOLDOWN_SEC);
    }
    // 2. Check if HTTP-date format (RFC 7231)
    const dateMs = Date.parse(trimmed);
    if (!isNaN(dateMs)) {
        const diffSec = Math.ceil((dateMs - Date.now()) / 1000);
        if (diffSec > 0) {
            return Math.min(diffSec, MAX_COOLDOWN_SEC);
        }
    }
    // 3. Fallback to safe 60s default for missing or invalid header
    return DEFAULT_COOLDOWN_SEC;
};

const executeUpstreamFetch = async (lat, lon, cacheKey, cached) => {
    let baseUrl = (process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast').trim();
    baseUrl = baseUrl.replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    if (!baseUrl || baseUrl === 'https://api.open-meteo.com') {
        baseUrl = 'https://api.open-meteo.com/v1/forecast';
    }

    const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KrishiMitra-AI/1.0 (https://github.com/11HarshitPatel11/KrishiMitra-AI)'
            },
            signal: AbortSignal.timeout(8000)
        });

        // Handle upstream non-200 responses
        if (!response.ok) {
            let reasonText = '';
            try {
                const errJson = await response.json();
                reasonText = errJson.reason || JSON.stringify(errJson);
            } catch (_) {}

            if (response.status === 429) {
                // Parse Retry-After header (supports delay-seconds and HTTP-date)
                const retryAfterHeader = response.headers ? response.headers.get('retry-after') : null;
                const cooldownSec = parseRetryAfter(retryAfterHeader);
                rateLimitBackoffUntil = Date.now() + (cooldownSec * 1000);
                console.error(`[WeatherService] Upstream Open-Meteo returned HTTP 429 Too Many Requests: "${reasonText}" (Cooldown: ${cooldownSec}s)`);
            } else {
                console.error(`[WeatherService] Upstream Open-Meteo returned HTTP ${response.status}${reasonText ? `: "${reasonText}"` : ''}`);
            }

            // Stale cache fallback on upstream error (<= 60 min old)
            const now = Date.now();
            if (cached && (now - cached.cachedAt) <= MAX_STALE_TTL_MS) {
                console.warn(`[WeatherService] Recovered via stale cache (<= 60m) on HTTP ${response.status} for ${cacheKey}`);
                return cached.data;
            }

            throw new Error(`Weather service is currently unavailable. Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.current) {
            console.error('[WeatherService] Malformed weather payload: missing .current field');
            throw new Error('Malformed weather data structure received');
        }

        const normalizedData = {
            temperature: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            rainfall: null,
            rainfall_status: 'not_aligned'
        };

        const now = Date.now();
        // Enforce cache capacity limit (FIFO eviction)
        if (weatherCache.size >= MAX_CACHE_ENTRIES && !weatherCache.has(cacheKey)) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
        }

        weatherCache.set(cacheKey, {
            data: normalizedData,
            cachedAt: now,
            expiresAt: now + FRESH_TTL_MS
        });

        return normalizedData;
    } catch (error) {
        // If network/upstream error occurred, check if we have a valid stale cache (<= 60 min)
        const now = Date.now();
        if (cached && (now - cached.cachedAt) <= MAX_STALE_TTL_MS) {
            console.warn(`[WeatherService] Upstream failure; recovering via stale cache for ${cacheKey}`);
            return cached.data;
        }

        const cause = error.cause ? ` (Cause: ${error.cause.code || error.cause.message || error.cause})` : '';
        console.error(`[WeatherService] Weather fetch failed: ${error.name || 'Error'} - ${error.message}${cause}`);

        if (error.message.includes('unavailable') || error.message.includes('Invalid')) {
            throw error;
        }
        throw new Error('Weather service is currently unavailable.');
    }
};

export const getCurrentWeather = async (latitude, longitude) => {
    // 1. Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Invalid latitude');
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error('Invalid longitude');
    }

    // 2. Quantize coordinates to 2 decimal places (approx 1.1 km resolution)
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const now = Date.now();
    const cached = weatherCache.get(cacheKey);

    // 3. Fresh cache hit: return immediately
    if (cached && now < cached.expiresAt) {
        return { ...cached.data };
    }

    // 4. Cooldown check: if rate-limited and still within backoff window
    if (now < rateLimitBackoffUntil) {
        // Stale-if-error fallback: only if cached within last 60 minutes
        if (cached && (now - cached.cachedAt) <= MAX_STALE_TTL_MS) {
            console.warn(`[WeatherService] Serving stale cache during 429 cooldown for ${cacheKey}`);
            return { ...cached.data };
        }
        console.warn(`[WeatherService] Upstream 429 cooldown active; blocking request without sending to Open-Meteo`);
        throw new Error('Weather service is currently unavailable. Status: 429');
    }

    // 5. Deduplicate concurrent in-flight requests for identical coordinates
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey).then(data => ({ ...data }));
    }

    // 6. Execute outbound fetch and track in-flight promise
    const fetchPromise = (async () => {
        try {
            return await executeUpstreamFetch(lat, lon, cacheKey, cached);
        } finally {
            inFlightRequests.delete(cacheKey);
        }
    })();

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise.then(data => ({ ...data }));
};

// Diagnostic & unit test helpers
export const _resetWeatherState = () => {
    weatherCache.clear();
    inFlightRequests.clear();
    rateLimitBackoffUntil = 0;
};

export const _setWeatherCacheEntry = (lat, lon, entry) => {
    const key = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
    if (weatherCache.size >= MAX_CACHE_ENTRIES && !weatherCache.has(key)) {
        const oldestKey = weatherCache.keys().next().value;
        weatherCache.delete(oldestKey);
    }
    weatherCache.set(key, entry);
};

export const _setRateLimitCooldown = (untilTimestamp) => {
    rateLimitBackoffUntil = untilTimestamp;
};

export const _getWeatherCacheSize = () => weatherCache.size;
export const _getRateLimitBackoffUntil = () => rateLimitBackoffUntil;
export const _getInFlightRequestsSize = () => inFlightRequests.size;
export const _MAX_CACHE_ENTRIES = MAX_CACHE_ENTRIES;
