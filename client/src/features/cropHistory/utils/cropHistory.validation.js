export const validateCropHistory = (data) => {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!data.farmId || data.farmId.trim() === '') {
        errors.push("Please select a farm.");
    }

    if (!data.crop || data.crop.trim() === '') {
        errors.push("Crop name is required.");
    }

    if (!data.season || data.season.trim() === '') {
        errors.push("Please select a season.");
    }

    if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > currentYear + 5) {
        errors.push("Enter a valid year.");
    }

    return errors;
};
