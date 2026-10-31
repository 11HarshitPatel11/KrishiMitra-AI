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

    // 2. Build Open-Meteo Request
    let baseUrl = (process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast').trim();
    baseUrl = baseUrl.replace(/^["']|["']$/g, '').replace(/\/+$/, '');
    if (!baseUrl || baseUrl === 'https://api.open-meteo.com') {
        baseUrl = 'https://api.open-meteo.com/v1/forecast';
    }

    // Using current=temperature_2m,relative_humidity_2m,precipitation
    const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation`;

    try {
        // 3. Call Open-Meteo with descriptive User-Agent and 8-second timeout
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KrishiMitra-AI/1.0 (https://github.com/11HarshitPatel11/KrishiMitra-AI)'
            },
            signal: AbortSignal.timeout(8000)
        });

        // 4. Check HTTP response status
        if (!response.ok) {
            console.error(`[WeatherService] Upstream Open-Meteo returned HTTP ${response.status}`);
            throw new Error(`Weather service is currently unavailable. Status: ${response.status}`);
        }

        // 5. Parse JSON
        const data = await response.json();

        // 6. Extract only required fields
        if (!data.current) {
            console.error('[WeatherService] Malformed weather payload: missing .current field');
            throw new Error('Malformed weather data structure received');
        }

        // 7. Return normalized application data
        return {
            temperature: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            rainfall: null,
            rainfall_status: 'not_aligned'
        };
    } catch (error) {
        // Safe server-side diagnostic logging (network, timeout, status)
        const cause = error.cause ? ` (Cause: ${error.cause.code || error.cause.message || error.cause})` : '';
        console.error(`[WeatherService] Weather fetch failed: ${error.name || 'Error'} - ${error.message}${cause}`);

        // Normalize errors to prevent exposing stack traces / raw underlying failures
        if (error.message.includes('unavailable') || error.message.includes('Invalid')) {
            throw error;
        }
        throw new Error('Weather service is currently unavailable.');
    }
};
