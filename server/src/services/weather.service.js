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
    const baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast';
    // Using current=temperature_2m,relative_humidity_2m,precipitation
    const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation`;

    try {
        // 3. Call Open-Meteo
        const response = await fetch(url);

        // 4. Check HTTP response status
        if (!response.ok) {
            throw new Error(`Weather service is currently unavailable. Status: ${response.status}`);
        }

        // 5. Parse JSON
        const data = await response.json();

        // 6. Extract only required fields
        if (!data.current) {
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
        // Normalize errors to prevent exposing stack traces / raw underlying failures
        if (error.message.includes('unavailable') || error.message.includes('Invalid')) {
            throw error;
        }
        throw new Error('Weather service is currently unavailable.');
    }
};
