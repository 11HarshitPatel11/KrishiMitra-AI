import { getCurrentWeather } from '../services/weather.service.js';
import { getProductionRainfall } from '../services/rainfall.service.js';
import { isRainfallOutOfDistribution } from '../utils/ml-bounds.js';

export const getWeather = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.query;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const weatherData = await getCurrentWeather(latitude, longitude);
        const rainfallData = await getProductionRainfall(latitude, longitude);

        // Remove the hardcoded rainfall status and null from weather to avoid conflict
        delete weatherData.rainfall;
        delete weatherData.rainfall_status;

        const diagnostic = {
            rainfall_out_of_distribution: isRainfallOutOfDistribution(rainfallData.data.rainfall)
        };

        res.status(200).json({
            success: true,
            message: 'Weather data fetched successfully',
            data: {
                ...weatherData,
                rainfall_data: rainfallData.data
            },
            diagnostic
        });
    } catch (error) {
        if (error.message === 'Invalid latitude' || error.message === 'Invalid longitude') {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Pass to standard error handler or return 503
        if (error.message.includes('unavailable')) {
            console.error(`[WeatherController] Weather retrieval failed: ${error.name || 'Error'} - ${error.message}`);
            return res.status(503).json({
                success: false,
                message: 'Weather service is currently unavailable.'
            });
        }

        next(error);
    }
};
