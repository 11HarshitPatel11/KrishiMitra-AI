export const validateFarmCreation = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return [{ path: 'body', message: 'Request body must be a valid JSON object' }];
    }
    const errors = [];

    if (!data.farmName || typeof data.farmName !== 'string' || data.farmName.trim() === '') {
        errors.push({ path: 'farmName', message: 'Farm name is required' });
    }

    if (data.area === undefined || data.area === null || typeof data.area !== 'number' || data.area <= 0) {
        errors.push({ path: 'area', message: 'Area must be a positive number' });
    }

    if (data.areaUnit !== 'acre' && data.areaUnit !== 'hectare') {
        errors.push({ path: 'areaUnit', message: "Area unit must be 'acre' or 'hectare'" });
    }

    if (data.nitrogen === undefined || data.nitrogen === null || typeof data.nitrogen !== 'number' || data.nitrogen < 0) {
        errors.push({ path: 'nitrogen', message: 'Nitrogen must be a non-negative number' });
    }

    if (data.phosphorus === undefined || data.phosphorus === null || typeof data.phosphorus !== 'number' || data.phosphorus < 0) {
        errors.push({ path: 'phosphorus', message: 'Phosphorus must be a non-negative number' });
    }

    if (data.potassium === undefined || data.potassium === null || typeof data.potassium !== 'number' || data.potassium < 0) {
        errors.push({ path: 'potassium', message: 'Potassium must be a non-negative number' });
    }

    if (data.pH === undefined || data.pH === null || typeof data.pH !== 'number' || data.pH < 0 || data.pH > 14) {
        errors.push({ path: 'pH', message: 'pH must be between 0 and 14' });
    }

    if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
        if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
            errors.push({ path: 'latitude', message: 'Latitude must be between -90 and 90' });
        }
    }

    if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
        if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
            errors.push({ path: 'longitude', message: 'Longitude must be between -180 and 180' });
        }
    }

    if (data.location !== undefined && data.location !== null) {
        if (typeof data.location !== 'string') {
            errors.push({ path: 'location', message: 'Location must be a string' });
        }
    }

    return errors;
};

// Fields that must never be accepted in a PATCH body.
const FORBIDDEN_UPDATE_FIELDS = ['userId', '_id', '__v', 'createdAt', 'updatedAt'];

// Fields that are permitted in a PATCH body (mirrors farm.service UPDATABLE_FIELDS).
const PERMITTED_UPDATE_FIELDS = [
    'farmName', 'area', 'areaUnit', 'nitrogen', 'phosphorus', 'potassium', 'pH', 'latitude', 'longitude', 'location',
];

export const validateFarmUpdate = (data) => {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        errors.push({ path: 'body', message: 'Request body must be a valid JSON object' });
        return errors;
    }

    const keys = Object.keys(data);

    // Reject empty bodies.
    if (keys.length === 0) {
        errors.push({ path: 'body', message: 'Request body must contain at least one updatable field' });
        return errors;
    }

    // Reject forbidden and unknown fields.
    for (const key of keys) {
        if (FORBIDDEN_UPDATE_FIELDS.includes(key)) {
            errors.push({ path: key, message: `Field '${key}' cannot be modified` });
        } else if (!PERMITTED_UPDATE_FIELDS.includes(key)) {
            errors.push({ path: key, message: `Field '${key}' is not a supported farm field` });
        }
    }
    if (errors.length > 0) return errors;

    // Validate each supplied field individually.
    if ('farmName' in data) {
        if (!data.farmName || typeof data.farmName !== 'string' || data.farmName.trim() === '') {
            errors.push({ path: 'farmName', message: 'Farm name must be a non-empty string' });
        }
    }
    if ('area' in data) {
        if (data.area === null || typeof data.area !== 'number' || data.area <= 0) {
            errors.push({ path: 'area', message: 'Area must be a positive number' });
        }
    }
    if ('areaUnit' in data) {
        if (data.areaUnit !== 'acre' && data.areaUnit !== 'hectare') {
            errors.push({ path: 'areaUnit', message: "Area unit must be 'acre' or 'hectare'" });
        }
    }
    if ('nitrogen' in data) {
        if (data.nitrogen === null || typeof data.nitrogen !== 'number' || data.nitrogen < 0) {
            errors.push({ path: 'nitrogen', message: 'Nitrogen must be a non-negative number' });
        }
    }
    if ('phosphorus' in data) {
        if (data.phosphorus === null || typeof data.phosphorus !== 'number' || data.phosphorus < 0) {
            errors.push({ path: 'phosphorus', message: 'Phosphorus must be a non-negative number' });
        }
    }
    if ('potassium' in data) {
        if (data.potassium === null || typeof data.potassium !== 'number' || data.potassium < 0) {
            errors.push({ path: 'potassium', message: 'Potassium must be a non-negative number' });
        }
    }
    if ('pH' in data) {
        if (data.pH === null || typeof data.pH !== 'number' || data.pH < 0 || data.pH > 14) {
            errors.push({ path: 'pH', message: 'pH must be between 0 and 14' });
        }
    }
    if ('latitude' in data) {
        if (data.latitude !== null && (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90)) {
            errors.push({ path: 'latitude', message: 'Latitude must be between -90 and 90' });
        }
    }
    if ('longitude' in data) {
        if (data.longitude !== null && (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180)) {
            errors.push({ path: 'longitude', message: 'Longitude must be between -180 and 180' });
        }
    }
    if ('location' in data) {
        if (data.location !== null && typeof data.location !== 'string') {
            errors.push({ path: 'location', message: 'Location must be a string' });
        }
    }

    return errors;
};
