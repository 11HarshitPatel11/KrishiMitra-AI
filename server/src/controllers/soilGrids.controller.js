import Farm from '../models/farm.model.js';
import ExternalSoilInformation from '../models/externalSoilInformation.model.js';
import { 
    fetchExternalSoilData, 
    storeOrUpdateExternalSoilInfo, 
    generateRegionalSoilEstimates 
} from '../services/soilGrids.service.js';

export const getExternalSoilInformation = async (req, res, next) => {
    try {
        const { farmId } = req.params;
        const userId = req.user.id;

        // Verify farm ownership + coordinates
        const farm = await Farm.findOne({ _id: farmId, userId });

        if (!farm) {
            return res.status(404).json({
                success: false,
                message: "Farm not found or not owned by user."
            });
        }

        const lat = farm.location?.coordinates?.[1] ?? farm.latitude;
        const lon = farm.location?.coordinates?.[0] ?? farm.longitude;

        if (lat === undefined || lon === undefined || lat === null || lon === null) {
            return res.status(400).json({
                success: false,
                message: "Farm location is required to retrieve external soil information. Please add coordinates to your farm."
            });
        }

        // Check if existing stored record exists in DB
        const existingStored = await ExternalSoilInformation.findOne({ farmId, userId });

        let normalizedProps;
        let isEstimated = false;
        let warning = null;

        try {
            // Attempt live sync from ISRIC SoilGrids
            normalizedProps = await fetchExternalSoilData(lat, lon);
        } catch (fetchError) {
            console.warn(`[SoilGrids] External fetch failed (${fetchError.message}). Using resilient fallback.`);

            if (existingStored && existingStored.properties) {
                return res.status(200).json({
                    success: true,
                    data: existingStored,
                    isCached: true,
                    warning: "ISRIC SoilGrids server is currently slow or unreachable. Displaying cached soil data."
                });
            }

            // Calibrated agro-climatic regional fallback based on farm coordinates
            normalizedProps = generateRegionalSoilEstimates(lat, lon);
            isEstimated = true;
            warning = "Upstream ISRIC SoilGrids server is experiencing high latency. Calibrated regional baseline soil profile loaded for your coordinates.";
        }

        const storedData = await storeOrUpdateExternalSoilInfo(userId, farmId, lat, lon, normalizedProps);

        return res.status(200).json({
            success: true,
            data: storedData,
            isEstimated,
            warning
        });

    } catch (error) {
        next(error);
    }
};

export const getStoredExternalSoilInformation = async (req, res, next) => {
    try {
        const { farmId } = req.params;
        const userId = req.user.id;

        const stored = await ExternalSoilInformation.findOne({ farmId, userId });

        if (!stored) {
            /* Rather than throwing an error, we explicitly state no data found 
               allowing the frontend to decide whether to poll */
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            data: stored
        });

    } catch (error) {
        next(error);
    }
};
