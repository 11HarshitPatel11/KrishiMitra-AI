export const validateRequest = (validatorFn) => (req, res, next) => {
    try {
        const errors = validatorFn(req.body);

        if (errors && errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors,
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
