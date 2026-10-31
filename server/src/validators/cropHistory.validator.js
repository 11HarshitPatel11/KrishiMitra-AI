import mongoose from 'mongoose';

export const validateCropHistoryCreation = (data) => {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!data.farmId || !mongoose.Types.ObjectId.isValid(data.farmId)) {
        errors.push({ path: 'farmId', message: 'Valid Farm ID is required' });
    }

    if (!data.crop || typeof data.crop !== 'string' || data.crop.trim() === '') {
        errors.push({ path: 'crop', message: 'Crop name is required' });
    }

    const validSeasons = ['Kharif', 'Rabi', 'Zaid', 'Other'];
    if (!data.season || typeof data.season !== 'string' || !validSeasons.includes(data.season.trim())) {
        errors.push({ path: 'season', message: 'Season must be one of: Kharif, Rabi, Zaid, Other' });
    }

    if (data.year === undefined || data.year === null || !Number.isInteger(Number(data.year)) || data.year < 1900 || data.year > currentYear + 5) {
        errors.push({ path: 'year', message: 'Year must be a valid reasonable integer' });
    }

    if (data.notes !== undefined && typeof data.notes !== 'string') {
        errors.push({ path: 'notes', message: 'Notes must be a string' });
    }

    return errors;
};

export const validateCropHistoryUpdate = (data) => {
    // For updates, fields can be optional, but if present must be valid
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (data.farmId && !mongoose.Types.ObjectId.isValid(data.farmId)) {
        errors.push({ path: 'farmId', message: 'If provided, Farm ID must be valid' });
    }

    if (data.crop !== undefined && (typeof data.crop !== 'string' || data.crop.trim() === '')) {
        errors.push({ path: 'crop', message: 'Crop name cannot be empty' });
    }

    if (data.season !== undefined) {
        const validSeasons = ['Kharif', 'Rabi', 'Zaid', 'Other'];
        if (typeof data.season !== 'string' || !validSeasons.includes(data.season.trim())) {
            errors.push({ path: 'season', message: 'Season must be one of: Kharif, Rabi, Zaid, Other' });
        }
    }

    if (data.year !== undefined && (!Number.isInteger(Number(data.year)) || data.year < 1900 || data.year > currentYear + 5)) {
        errors.push({ path: 'year', message: 'Year must be a valid reasonable integer' });
    }

    if (data.notes !== undefined && typeof data.notes !== 'string') {
        errors.push({ path: 'notes', message: 'Notes must be a string' });
    }

    return errors;
};
