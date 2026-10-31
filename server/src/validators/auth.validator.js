export const validateRegister = (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push({ path: 'name', message: 'Name is required' });
    }

    if (!data.email || typeof data.email !== 'string' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
        errors.push({ path: 'email', message: 'A valid email is required' });
    }

    if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
        errors.push({ path: 'password', message: 'Password must be at least 6 characters long' });
    }

    return errors;
};

export const validateLogin = (data) => {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
        errors.push({ path: 'email', message: 'Email is required' });
    }

    if (!data.password || typeof data.password !== 'string') {
        errors.push({ path: 'password', message: 'Password is required' });
    }

    return errors;
};

// Fields that must never be modified via the profile update endpoint
const FORBIDDEN_PROFILE_FIELDS = ['_id', 'id', 'email', 'password', 'role', '__v', 'createdAt', 'updatedAt'];

// Fields explicitly permitted for profile updates according to schema and SRS
const PERMITTED_PROFILE_FIELDS = ['name', 'mobileNumber', 'location'];

export const validateProfileUpdate = (data) => {
    const errors = [];

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        errors.push({ path: 'body', message: 'Request body must be a valid JSON object' });
        return errors;
    }

    const keys = Object.keys(data);

    if (keys.length === 0) {
        errors.push({ path: 'body', message: 'Request body must contain at least one updatable field' });
        return errors;
    }

    // Check for forbidden and unsupported fields
    for (const key of keys) {
        if (FORBIDDEN_PROFILE_FIELDS.includes(key)) {
            errors.push({ path: key, message: `Field '${key}' cannot be modified via profile update` });
        } else if (!PERMITTED_PROFILE_FIELDS.includes(key)) {
            errors.push({ path: key, message: `Field '${key}' is not a supported profile field` });
        }
    }

    if (errors.length > 0) return errors;

    // Validate permitted fields when present
    if ('name' in data) {
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
            errors.push({ path: 'name', message: 'Name must be a non-empty string' });
        }
    }

    if ('mobileNumber' in data) {
        if (data.mobileNumber !== null && typeof data.mobileNumber !== 'string') {
            errors.push({ path: 'mobileNumber', message: 'Mobile number must be a string' });
        }
    }

    if ('location' in data) {
        if (data.location !== null && typeof data.location !== 'string') {
            errors.push({ path: 'location', message: 'Location must be a string' });
        }
    }

    return errors;
};
