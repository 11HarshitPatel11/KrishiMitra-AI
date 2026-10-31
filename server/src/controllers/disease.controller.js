import { DiseaseService } from '../services/disease.service.js';
import { DiseaseInformationService } from '../services/diseaseInformation.service.js';

export const predictDisease = async (req, res, next) => {
    try {
        const fileBuffer = req.file.buffer;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;

        // 1. ML Inference via FastAPI
        const mlResponse = await DiseaseService.predictDisease(fileBuffer, originalName, mimeType);

        // Validation bounds check
        if (!mlResponse || !mlResponse.success || !mlResponse.data || !mlResponse.data.prediction) {
            return res.status(502).json({
                success: false,
                message: 'Received invalid response structure from Disease ML Service.'
            });
        }

        const prediction = mlResponse.data.prediction;
        const top3 = mlResponse.data.top3 || [];
        const diseaseCode = prediction.className;

        let information = null;
        let informationStatus = "unavailable";
        let message = "Disease detection completed successfully"; // Base assumption

        // 2. Check threshold guarantees
        if (prediction.status === "uncertain") {
            // Guard against presenting uncertain ML predictions as concrete facts
            message = "Disease prediction is uncertain. Please consult a professional or provide a clearer image.";
            informationStatus = "withheld_due_to_uncertainty";
        } else {
            // ML is confident, look up DB
            try {
                information = await DiseaseInformationService.getDiseaseByCode(diseaseCode);

                if (information) {
                    informationStatus = "available";
                } else {
                    message = "Disease detected, but detailed disease information is currently unavailable.";
                }
            } catch (dbError) {
                // Return controlled DB error strictly, avoid calling it an ML failure
                console.error("Database failure while fetching disease information:", dbError);
                return res.status(500).json({
                    success: false,
                    message: "An internal database error occurred while retrieving disease information."
                });
            }
        }

        // 3. Return Combined Structured Payload
        return res.status(200).json({
            success: true,
            message,
            data: {
                prediction,
                top3,
                information,
                informationStatus
            }
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        // Let standard Express error middleware handle unknown exceptions
        next(error);
    }
};
