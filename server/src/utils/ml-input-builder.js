/**
 * ML Input Builder
 * 
 * Provides a clean conceptual boundary ensuring that disjointed domain data
 * (Farm data from DB or user, Weather data from external APIs, Rainfall strategy)
 * is definitively consolidated into the strict Canonical 7-feature requirement
 * before communicating with the Python ML inference service.
 */

export class MLInputBuilder {
    /**
     * Constructs the canonical ML feature payload.
     * @param {Object} farmData - { nitrogen, phosphorus, potassium, pH }
     * @param {Object} weatherData - { temperature, humidity }
     * @param {Object} rainfallData - { rainfall }
     * @returns {Object} Extracted strict 7 numerical features payload
     */
    static build(farmData, weatherData, rainfallData) {
        // Enforce strict mapping to canonical features format
        return {
            nitrogen: farmData.nitrogen,
            phosphorus: farmData.phosphorus,
            potassium: farmData.potassium,
            pH: farmData.pH,
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            rainfall: rainfallData?.rainfall // Will be null/undefined if unresolved
        };
    }
}
