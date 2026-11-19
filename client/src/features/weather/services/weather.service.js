import { API_BASE_URL } from '../../../config/api.config';

export const weatherService = {
    /**
     * Retrieves current temperature and humidity for given coordinates.
     * Primary: Calls backend proxy endpoint GET /api/v1/weather/current
     * Fallback: Directly queries Open-Meteo API from browser if backend is temporarily rate-limited or unavailable.
     *
     * @param {number|string} latitude
     * @param {number|string} longitude
     * @returns {Promise<{ temperature: number, humidity: number, source: string }>}
     */
    getCurrentWeather: async (latitude, longitude) => {
        // 1. Primary Attempt: Node.js Express backend proxy
        try {
            const response = await fetch(`${API_BASE_URL}/weather/current?latitude=${latitude}&longitude=${longitude}`, {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && typeof data.data.temperature === 'number' && typeof data.data.humidity === 'number') {
                    return {
                        ...data.data,
                        source: 'api'
                    };
                }
            }
        } catch (backendError) {
            console.warn('[WeatherService] Backend weather endpoint unreachable:', backendError.message);
        }

        // 2. Resilient Browser-Direct Fallback: Query Open-Meteo API directly
        // (Open-Meteo provides Access-Control-Allow-Origin: * and uses the user's residential IP)
        try {
            const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`;
            const directResponse = await fetch(openMeteoUrl, {
                signal: AbortSignal.timeout(8000)
            });

            if (directResponse.ok) {
                const directData = await directResponse.json();
                if (directData?.current?.temperature_2m !== undefined && directData?.current?.relative_humidity_2m !== undefined) {
                    return {
                        temperature: Number(directData.current.temperature_2m),
                        humidity: Number(directData.current.relative_humidity_2m),
                        source: 'api'
                    };
                }
            }
        } catch (directError) {
            console.warn('[WeatherService] Direct Open-Meteo fetch failed:', directError.message);
        }

        // 3. Both failed: provide clear message so user can use the manual fallback drawer
        throw new Error('Weather service is currently unavailable. Please enter temperature and humidity manually below.');
    }
};
