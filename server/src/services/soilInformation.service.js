import SoilInformation from '../models/soilInformation.model.js';
import Farm from '../models/farm.model.js';

export const createSoilInformationService = async (soilData, userId) => {
    const { farmId } = soilData;

    // Verify farm ownership
    const farm = await Farm.findOne({ _id: farmId, userId });
    if (!farm) {
        const error = new Error('Farm not found or not owned by user');
        error.statusCode = 404;
        throw error;
    }

    // Attempt to create. If index violates unique farmId+userId, mongooose will throw 11000 duplicate error
    // Enforce source manual explicitly
    const newSoilInfo = new SoilInformation({
        ...soilData,
        userId,
        source: 'manual'
    });

    return await newSoilInfo.save();
};

export const getSoilInformationByUserService = async (userId) => {
    return await SoilInformation.find({ userId }).sort({ createdAt: -1 });
};

export const getSoilInformationByFarmService = async (farmId, userId) => {
    return await SoilInformation.find({ farmId, userId }).sort({ createdAt: -1 });
};

export const getSoilInformationByIdService = async (id, userId) => {
    return await SoilInformation.findOne({ _id: id, userId });
};

export const updateSoilInformationService = async (id, updateData, userId) => {
    // If they try to change the farm, verify they own the new farm
    if (updateData.farmId) {
        const farm = await Farm.findOne({ _id: updateData.farmId, userId });
        if (!farm) {
            const error = new Error('Farm not found or not owned by user');
            error.statusCode = 404;
            throw error;
        }
    }

    // Force non-external source if they try to manipulate it manually
    if (updateData.source && updateData.source === 'external') {
        const error = new Error('Cannot manually set source to external in this phase');
        error.statusCode = 400;
        throw error;
    }

    // Always fall back to manual for updates in this initial phase 
    const payload = { ...updateData, source: 'manual' };

    const soilInfo = await SoilInformation.findOneAndUpdate(
        { _id: id, userId },
        payload,
        { new: true, runValidators: true }
    );

    if (!soilInfo) {
        const error = new Error('Soil information not found');
        error.statusCode = 404;
        throw error;
    }
    return soilInfo;
};

export const deleteSoilInformationService = async (id, userId) => {
    const soilInfo = await SoilInformation.findOneAndDelete({ _id: id, userId });
    if (!soilInfo) {
        const error = new Error('Soil information not found');
        error.statusCode = 404;
        throw error;
    }
    return soilInfo;
};
