export const validateSoilForm = (formData) => {
    const errors = {};

    if (!formData.farmId) {
        errors.farmId = 'Please select a farm.';
    }

    if (formData.pH !== '') {
        const phVal = Number(formData.pH);
        if (isNaN(phVal) || phVal < 0 || phVal > 14) {
            errors.pH = 'pH must be between 0 and 14.';
        }
    }

    const checkNonNegative = (field, label) => {
        if (formData[field] !== '') {
            const val = Number(formData[field]);
            if (isNaN(val) || val < 0) {
                errors[field] = `${label} must be a non-negative number.`;
            }
        }
    };

    checkNonNegative('nitrogen', 'Nitrogen');
    checkNonNegative('phosphorus', 'Phosphorus');
    checkNonNegative('potassium', 'Potassium');
    checkNonNegative('moisture', 'Moisture');

    return errors;
};
