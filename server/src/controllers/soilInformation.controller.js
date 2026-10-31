import {
    createSoilInformationService,
    getSoilInformationByUserService,
    getSoilInformationByFarmService,
    getSoilInformationByIdService,
    updateSoilInformationService,
    deleteSoilInformationService
} from '../services/soilInformation.service.js';

export const createSoilInformation = async (req, res, next) => {
    try {
        if (!req.body.farmId) {
            return res.status(400).json({ success: false, message: 'farmId is required' });
        }

        const soilInfo = await createSoilInformationService(req.body, req.user.id);
        res.status(201).json({
            success: true,
            message: 'Soil information created successfully',
            data: soilInfo
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate unique index violation (userId + farmId)
            return res.status(400).json({
                success: false,
                message: 'Soil information record already exists for this farm'
            });
        }
        next(error);
    }
};

export const getSoilInformationByUser = async (req, res, next) => {
    try {
        const soilInfoList = await getSoilInformationByUserService(req.user.id);
        res.status(200).json({
            success: true,
            data: soilInfoList
        });
    } catch (error) {
        next(error);
    }
};

export const getSoilInformationByFarm = async (req, res, next) => {
    try {
        const soilInfoList = await getSoilInformationByFarmService(req.params.farmId, req.user.id);
        res.status(200).json({
            success: true,
            data: soilInfoList
        });
    } catch (error) {
        next(error);
    }
};

export const getSoilInformationById = async (req, res, next) => {
    try {
        const soilInfo = await getSoilInformationByIdService(req.params.id, req.user.id);
        if (!soilInfo) {
            return res.status(404).json({
                success: false,
                message: 'Soil information not found'
            });
        }
        res.status(200).json({
            success: true,
            data: soilInfo
        });
    } catch (error) {
        next(error);
    }
};

export const updateSoilInformation = async (req, res, next) => {
    try {
        const soilInfo = await updateSoilInformationService(req.params.id, req.body, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Soil information updated successfully',
            data: soilInfo
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A soil record for this farm already exists'
            });
        }
        next(error);
    }
};

export const deleteSoilInformation = async (req, res, next) => {
    try {
        await deleteSoilInformationService(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Soil information deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
