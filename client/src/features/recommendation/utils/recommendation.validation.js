/**
 * Validation rules native to standard Javascript without Zod/Joi.
 */

const isNumeric = (val) => {
    if (val === null || val === undefined || val === '') return false;
    return !isNaN(Number(val)) && isFinite(val);
};

export const validateRecommendationInput = (values) => {
    const errors = {};

    // Nitrogen
    if (!isNumeric(values.nitrogen)) errors.nitrogen = 'Nitrogen is required and must be numeric.';
    else if (Number(values.nitrogen) < 0) errors.nitrogen = 'Nitrogen cannot be negative.';

    // Phosphorus
    if (!isNumeric(values.phosphorus)) errors.phosphorus = 'Phosphorus is required and must be numeric.';
    else if (Number(values.phosphorus) < 0) errors.phosphorus = 'Phosphorus cannot be negative.';

    // Potassium
    if (!isNumeric(values.potassium)) errors.potassium = 'Potassium is required and must be numeric.';
    else if (Number(values.potassium) < 0) errors.potassium = 'Potassium cannot be negative.';

    // Temperature (can physically be negative in some extreme agricultural regimes, but typically bounded. Just requiring numeric)
    if (!isNumeric(values.temperature)) errors.temperature = 'Temperature is required and must be numeric.';

    // Humidity
    if (!isNumeric(values.humidity)) errors.humidity = 'Humidity is required and must be numeric.';
    else if (Number(values.humidity) < 0 || Number(values.humidity) > 100) errors.humidity = 'Humidity must be between 0 and 100 percent.';

    // pH
    if (!isNumeric(values.pH)) errors.pH = 'pH is required and must be numeric.';
    else if (Number(values.pH) < 0 || Number(values.pH) > 14) errors.pH = 'pH must be exactly between 0 and 14.';

    // Rainfall
    if (!isNumeric(values.rainfall)) errors.rainfall = 'Rainfall is required and must be numeric.';
    else if (Number(values.rainfall) < 0) errors.rainfall = 'Rainfall cannot be negative.';

    // Latitude
    if (values.latitude !== undefined && values.latitude !== '') {
        if (!isNumeric(values.latitude)) errors.latitude = 'Latitude must be numeric.';
        else if (Number(values.latitude) < -90 || Number(values.latitude) > 90) errors.latitude = 'Latitude must be between -90 and 90.';
    }

    // Longitude
    if (values.longitude !== undefined && values.longitude !== '') {
        if (!isNumeric(values.longitude)) errors.longitude = 'Longitude must be numeric.';
        else if (Number(values.longitude) < -180 || Number(values.longitude) > 180) errors.longitude = 'Longitude must be between -180 and 180.';
    }

    // Optional manual State and District validation
    if (values.state !== undefined && values.state !== null && values.state !== '') {
        if (typeof values.state !== 'string' || values.state.length > 100) {
            errors.state = 'State must be a valid text under 100 characters.';
        }
    }

    if (values.district !== undefined && values.district !== null && values.district !== '') {
        if (typeof values.district !== 'string' || values.district.length > 100) {
            errors.district = 'District must be a valid text under 100 characters.';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
