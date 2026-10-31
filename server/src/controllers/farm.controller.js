import mongoose from 'mongoose';
import {
    createFarmService,
    getAllFarmsService,
    getFarmByIdService,
    updateFarmService,
    deleteFarmService,
} from '../services/farm.service.js';
import { reverseGeocode } from '../utils/reverse-geocode.js';

export const createFarm = async (req, res, next) => {
    try {
        const farmData = req.body;
        const newFarm = await createFarmService(farmData, req.user.id);

        return res.status(201).json({
            success: true,
            message: 'Farm information created successfully',
            data: newFarm,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllFarms = async (req, res, next) => {
    try {
        const farms = await getAllFarmsService(req.user.id);
        return res.status(200).json({
            success: true,
            message: 'Farms fetched successfully',
            data: farms,
        });
    } catch (error) {
        next(error);
    }
};

export const getFarmById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid farm ID'
            });
        }

        const farm = await getFarmByIdService(id, req.user.id);

        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Farm fetched successfully',
            data: farm,
        });
    } catch (error) {
        next(error);
    }
};

export const updateFarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid farm ID',
            });
        }

        const updatedFarm = await updateFarmService(id, req.user.id, req.body);

        if (!updatedFarm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Farm updated successfully',
            data: updatedFarm,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid farm ID',
            });
        }

        const result = await deleteFarmService(id, req.user.id);

        if (result === null) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found',
            });
        }

        if (result.blocked) {
            const { cropHistory, soilInformation, externalSoilInformation } = result.counts;
            const details = [];
            if (cropHistory > 0) details.push(`${cropHistory} crop history record(s)`);
            if (soilInformation > 0) details.push(`${soilInformation} soil information record(s)`);
            if (externalSoilInformation > 0) details.push(`${externalSoilInformation} external soil record(s)`);

            return res.status(409).json({
                success: false,
                message: `Cannot delete farm because it has dependent records: ${details.join(', ')}. Remove them first.`,
                data: { dependentCounts: result.counts },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Farm deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const reverseGeocodeFarmLocation = async (req, res, next) => {
    try {
        const { latitude, longitude, lat, lon } = req.query;
        const rawLat = latitude !== undefined ? latitude : lat;
        const rawLng = longitude !== undefined ? longitude : lon;

        if (rawLat === undefined || rawLng === undefined || rawLat === '' || rawLng === '') {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude coordinates are required',
            });
        }

        const parsedLat = Number(rawLat);
        const parsedLng = Number(rawLng);

        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
            return res.status(400).json({
                success: false,
                message: 'Latitude must be between -90 and 90',
            });
        }

        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Longitude must be between -180 and 180',
            });
        }

        const geo = await reverseGeocode(parsedLat, parsedLng);
        if (!geo) {
            return res.status(200).json({
                success: false,
                message: 'Could not resolve address for given coordinates',
                data: null,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Location resolved successfully',
            data: geo,
        });
    } catch (error) {
        next(error);
    }
};
