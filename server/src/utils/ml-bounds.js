// Extracted from ml-service/datasets/Crop_recommendation.csv
// Overall statistics for the rainfall feature.
const RAINFALL_STATS = {
    min: 20.21126747,
    max: 298.5601175,
    mean: 103.4636554,
    median: 94.86762427
};

/**
 * Checks if a given rainfall value falls outside the known limits of the training distribution.
 * This is for training-distribution OOD (Out-Of-Distribution) detection only.
 * It does NOT mean the rainfall value is physically invalid.
 * @param {number} rainfall - The rainfall value to check against training bounds
 * @returns {boolean} true if out of training distribution, false otherwise
 */
export const isRainfallOutOfDistribution = (rainfall) => {
    if (typeof rainfall !== 'number' || isNaN(rainfall)) return true;

    // Check if the value is below the absolute training minimum or above the absolute maximum
    if (rainfall < RAINFALL_STATS.min || rainfall > RAINFALL_STATS.max) {
        return true;
    }
    return false;
};
