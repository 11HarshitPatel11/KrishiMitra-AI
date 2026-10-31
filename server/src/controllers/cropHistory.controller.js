import mongoose from 'mongoose';
import {
    createCropHistoryService,
    getCropHistoriesByUserService,
    getCropHistoriesByFarmService,
    getCropHistoryByIdService,
    updateCropHistoryService,
    deleteCropHistoryService
} from '../services/cropHistory.service.js';

export const createCropHistory = async (req, res, next) => {
    try {
        const historyData = req.body;
        const newHistory = await createCropHistoryService(historyData, req.user.id);

        return res.status(201).json({
            success: true,
            message: 'Crop history created successfully',
            data: newHistory,
        });
    } catch (error) {
        next(error);
    }
};

export const getCropHistories = async (req, res, next) => {
    try {
        const histories = await getCropHistoriesByUserService(req.user.id);
        return res.status(200).json({
            success: true,
            message: 'Crop histories fetched successfully',
            data: histories,
        });
    } catch (error) {
        next(error);
    }
};

export const getCropHistoriesByFarm = async (req, res, next) => {
    try {
        const { farmId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(farmId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Farm ID'
            });
        }

        const histories = await getCropHistoriesByFarmService(farmId, req.user.id);

        return res.status(200).json({
            success: true,
            message: 'Farm crop histories fetched successfully',
            data: histories,
        });
    } catch (error) {
        next(error);
    }
};

export const getCropHistoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Crop History ID'
            });
        }

        const history = await getCropHistoryByIdService(id, req.user.id);

        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'Crop history not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Crop history fetched successfully',
            data: history,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCropHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Crop History ID'
            });
        }

        const updatedHistory = await updateCropHistoryService(id, req.body, req.user.id);

        return res.status(200).json({
            success: true,
            message: 'Crop history updated successfully',
            data: updatedHistory,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCropHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Crop History ID'
            });
        }

        await deleteCropHistoryService(id, req.user.id);

        return res.status(200).json({
            success: true,
            message: 'Crop history deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
