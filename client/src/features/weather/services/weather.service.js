import { API_BASE_URL } from '../../../config/api.config';

export const weatherService = {
    getCurrentWeather: async (latitude, longitude) => {
        try {
            const response = await fetch(`${API_BASE_URL}/weather/current?latitude=${latitude}&longitude=${longitude}`, {
                method: 'GET'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to fetch weather data. Please check the coordinates and try again.');
            }

            return data.data; // { temperature, humidity, rainfall }
        } catch (error) {
            throw new Error(error.message || 'Unable to fetch weather data. Please check the coordinates and try again.');
        }
    }
};
