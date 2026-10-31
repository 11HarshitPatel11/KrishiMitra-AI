export const validateMarketQuery = (req, res, next) => {
    const { commodity, state, district, limit } = req.query;
    const errors = [];

    if (commodity && (typeof commodity !== 'string' || commodity.trim() === '')) {
        errors.push("Commodity must be a valid non-empty string.");
    }
    if (state && (typeof state !== 'string' || state.trim() === '')) {
        errors.push("State must be a valid non-empty string.");
    }
    if (district && (typeof district !== 'string' || district.trim() === '')) {
        errors.push("District must be a valid non-empty string.");
    }

    if (limit) {
        const parsedLimit = Number(limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            errors.push("Limit must be a reasonable positive integer between 1 and 100.");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    next();
};
