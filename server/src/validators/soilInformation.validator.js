export const validateSoilInformationInput = (req, res, next) => {
    const { pH, nitrogen, phosphorus, potassium, moisture, soilType, notes } = req.body;
    let errors = [];

    if (pH !== undefined && pH !== null) {
        if (typeof pH !== 'number' || pH < 0 || pH > 14) {
            errors.push('pH must be a number between 0 and 14');
        }
    }

    if (nitrogen !== undefined && nitrogen !== null) {
        if (typeof nitrogen !== 'number' || nitrogen < 0) {
            errors.push('Nitrogen must be a non-negative number');
        }
    }

    if (phosphorus !== undefined && phosphorus !== null) {
        if (typeof phosphorus !== 'number' || phosphorus < 0) {
            errors.push('Phosphorus must be a non-negative number');
        }
    }

    if (potassium !== undefined && potassium !== null) {
        if (typeof potassium !== 'number' || potassium < 0) {
            errors.push('Potassium must be a non-negative number');
        }
    }

    if (moisture !== undefined && moisture !== null) {
        if (typeof moisture !== 'number' || moisture < 0) {
            errors.push('Moisture must be a non-negative number');
        }
    }

    if (soilType && typeof soilType !== 'string') {
        errors.push('soilType must be a string');
    }

    if (notes && typeof notes !== 'string') {
        errors.push('notes must be a string');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }

    next();
};
