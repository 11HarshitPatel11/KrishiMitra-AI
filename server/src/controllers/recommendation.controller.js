import { RecommendationService } from '../services/recommendation.service.js';

/**
 * 7. Why weather values are currently supplied explicitly and will later come from a weather service: 
 * Because the primary goal of this iteration is proving end-to-end Machine Learning data flow structurally.
 * In a future sprint, these environmental metrics will be injected dynamically behind the scenes by querying a Weather API.
 */
export const predictCrop = async (req, res, next) => {
    try {
        const {
            nitrogen,
            phosphorus,
            potassium,
            temperature,
            humidity,
            pH,
            rainfall,
            farmId,
            state,
            district
        } = req.body;

        const predictionData = await RecommendationService.getCropPrediction({
            nitrogen,
            phosphorus,
            potassium,
            temperature,
            humidity,
            pH,
            rainfall,
            farmId,
            userId: req.user.id,
            state,
            district
        });

        res.status(200).json({
            success: true,
            message: "Crop recommendation generated successfully",
            data: predictionData
        });
    } catch (error) {
        if (error.message.includes('ML Service')) {
            // Forward ML connectivity errors as a controlled 503 instead of crashing Node
            return res.status(503).json({
                success: false,
                message: "ML service is currently unavailable or failed to process."
            });
        }
        next(error); // Bubble up to standard error handler
    }
};
