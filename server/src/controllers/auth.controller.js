import {
    registerUserService,
    loginUserService,
    getUserProfileService,
    updateUserProfileService
} from '../services/auth.service.js';

export const register = async (req, res, next) => {
    try {
        const userData = req.body;
        const user = await registerUserService(userData);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await loginUserService(email, password);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token: data.token,
                user: data.user,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const user = await getUserProfileService(req.user.id);

        return res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const user = await updateUserProfileService(req.user.id, req.body);

        return res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};
