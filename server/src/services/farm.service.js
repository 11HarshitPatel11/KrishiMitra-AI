import Farm from '../models/farm.model.js';
import CropHistory from '../models/cropHistory.model.js';
import SoilInformation from '../models/soilInformation.model.js';
import ExternalSoilInformation from '../models/externalSoilInformation.model.js';

export const createFarmService = async (farmData, userId) => {
    const newFarm = new Farm({ ...farmData, userId });
    const savedFarm = await newFarm.save();
    return savedFarm;
};

export const getAllFarmsService = async (userId) => {
    return await Farm.find({ userId }).sort({ createdAt: -1 });
};

export const getFarmByIdService = async (id, userId) => {
    return await Farm.findOne({ _id: id, userId });
};

// Permitted mutable fields for PATCH — userId is deliberately excluded.
const UPDATABLE_FIELDS = [
    'farmName',
    'area',
    'areaUnit',
    'nitrogen',
    'phosphorus',
    'potassium',
    'pH',
    'latitude',
    'longitude',
    'location',
];

export const updateFarmService = async (id, userId, updateData) => {
    // Build a safe update object — only permitted fields, userId never touched.
    const safeUpdate = {};
    for (const key of UPDATABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
            safeUpdate[key] = updateData[key];
        }
    }

    return await Farm.findOneAndUpdate(
        { _id: id, userId },            // ownership check inside query
        { $set: safeUpdate },
        { new: true, runValidators: true }
    );
};

/**
 * Returns { deleted: true } on success.
 * Returns { blocked: true, counts: {...} } when dependent records exist.
 * Returns null when farm not found / not owned.
 */
export const deleteFarmService = async (id, userId) => {
    const farm = await Farm.findOne({ _id: id, userId });
    if (!farm) return null;

    // Check for dependent records before deleting.
    const [cropHistoryCount, soilCount, extSoilCount] = await Promise.all([
        CropHistory.countDocuments({ farmId: id }),
        SoilInformation.countDocuments({ farmId: id }),
        ExternalSoilInformation.countDocuments({ farmId: id }),
    ]);

    const total = cropHistoryCount + soilCount + extSoilCount;
    if (total > 0) {
        return {
            blocked: true,
            counts: {
                cropHistory: cropHistoryCount,
                soilInformation: soilCount,
                externalSoilInformation: extSoilCount,
            },
        };
    }

    await Farm.deleteOne({ _id: id, userId });
    return { deleted: true };
};
