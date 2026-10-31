import CropHistory from '../models/cropHistory.model.js';
import Farm from '../models/farm.model.js';

export const createCropHistoryService = async (historyData, userId) => {
    const { farmId } = historyData;

    // Verify farm ownership
    const farm = await Farm.findOne({ _id: farmId, userId });
    if (!farm) {
        const error = new Error('Farm not found or not owned by user');
        error.statusCode = 404;
        throw error;
    }

    const newHistory = new CropHistory({ ...historyData, userId });
    return await newHistory.save();
};

export const getCropHistoriesByUserService = async (userId) => {
    return await CropHistory.find({ userId }).sort({ year: -1, createdAt: -1 });
};

export const getCropHistoriesByFarmService = async (farmId, userId) => {
    // Verify farm ownership if needed, but the query itself ensures we only get history for our own farm
    // Since history itself has userId, filtering by both is secure
    return await CropHistory.find({ farmId, userId }).sort({ year: -1, createdAt: -1 });
};

export const getCropHistoryByIdService = async (id, userId) => {
    return await CropHistory.findOne({ _id: id, userId });
};

export const updateCropHistoryService = async (id, updateData, userId) => {
    if (updateData.farmId) {
        const farm = await Farm.findOne({ _id: updateData.farmId, userId });
        if (!farm) {
            const error = new Error('Farm not found or not owned by user');
            error.statusCode = 404;
            throw error;
        }
    }

    const history = await CropHistory.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!history) {
        const error = new Error('Crop history not found');
        error.statusCode = 404;
        throw error;
    }
    return history;
};

export const deleteCropHistoryService = async (id, userId) => {
    const history = await CropHistory.findOneAndDelete({ _id: id, userId });
    if (!history) {
        const error = new Error('Crop history not found');
        error.statusCode = 404;
        throw error;
    }
    return history;
};
