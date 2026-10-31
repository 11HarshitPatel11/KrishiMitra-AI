import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUserService = async (userData) => {
    const { name, email, password, mobileNumber, location } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('Email already taken');
        error.statusCode = 400; // Will be handled by error middleware
        throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        mobileNumber,
        location
    });

    return {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
    };
};

export const loginUserService = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    };
};

export const getUserProfileService = async (userId) => {
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber || null,
        location: user.location || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};

export const updateUserProfileService = async (userId, profileData) => {
    // Whitelist only permitted fields as defense-in-depth
    const updates = {};
    if (typeof profileData.name === 'string' && profileData.name.trim()) {
        updates.name = profileData.name.trim();
    }
    if ('mobileNumber' in profileData) {
        updates.mobileNumber = profileData.mobileNumber ? profileData.mobileNumber.trim() : null;
    }
    if ('location' in profileData) {
        updates.location = profileData.location ? profileData.location.trim() : null;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber || null,
        location: updatedUser.location || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
    };
};
