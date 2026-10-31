export const validateMarketFilters = (filters) => {
    const errors = {};

    if (filters.commodity && typeof filters.commodity !== 'string') {
        errors.commodity = "Commodity must be text.";
    }

    if (filters.state && typeof filters.state !== 'string') {
        errors.state = "State must be text.";
    }

    if (filters.district && typeof filters.district !== 'string') {
        errors.district = "District must be text.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
