/**
 * Custom validation for crop recommendation securely in Node.js
 * 
 * 4. Why the backend validates input before forwarding it: We prevent malicious or malformed logic errors from executing deeply within the network stack, avoiding potentially costly inner service calls.
 */

export const validateRecommendationInput = (req, res, next) => {
    const {
        nitrogen,
        phosphorus,
        potassium,
        temperature,
        humidity,
        pH,
        rainfall
    } = req.body;

    const errors = [];

    // Check presence of required 7 ML model features
    const requiredFields = [
        'nitrogen', 'phosphorus', 'potassium',
        'temperature', 'humidity', 'pH', 'rainfall'
    ];

    for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
            errors.push(`${field} is required and cannot be null.`);
        } else if (typeof req.body[field] !== 'number' || isNaN(req.body[field]) || !isFinite(req.body[field])) {
            errors.push(`${field} must be a valid finite number.`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Domain bounds specifically required
    if (nitrogen < 0) errors.push("nitrogen must be >= 0");
    if (phosphorus < 0) errors.push("phosphorus must be >= 0");
    if (potassium < 0) errors.push("potassium must be >= 0");
    if (pH < 0 || pH > 14) errors.push("pH must be between 0 and 14");
    if (rainfall < 0) errors.push("rainfall must be >= 0");

    if (req.body.farmId) {
        if (typeof req.body.farmId !== 'string' || req.body.farmId.length !== 24) {
            errors.push("If provided, farmId must be a valid ID string.");
        }
    }

    // Optional manual state/district validation for market intelligence fallback
    if (req.body.state !== undefined && req.body.state !== null && req.body.state !== '') {
        if (typeof req.body.state !== 'string' || req.body.state.trim() === '' || req.body.state.length > 100) {
            errors.push("If provided, state must be a valid non-empty string under 100 characters.");
        }
    }

    if (req.body.district !== undefined && req.body.district !== null && req.body.district !== '') {
        if (typeof req.body.district !== 'string' || req.body.district.trim() === '' || req.body.district.length > 100) {
            errors.push("If provided, district must be a valid non-empty string under 100 characters.");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    next();
};
