import { DiseaseInformationService } from '../services/diseaseInformation.service.js';

export const getDiseaseInformation = async (req, res, next) => {
    try {
        const { diseaseCode } = req.params;

        if (!diseaseCode) {
            return res.status(400).json({
                success: false,
                message: 'diseaseCode parameter is required'
            });
        }

        const info = await DiseaseInformationService.getDiseaseByCode(diseaseCode);

        if (!info) {
            return res.status(404).json({
                success: true,
                message: 'Disease information is currently unavailable.',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Disease information retrieved successfully',
            data: info
        });
    } catch (error) {
        next(error);
    }
};

export const getSupportedDiseases = async (req, res, next) => {
    try {
        const diseases = await DiseaseInformationService.getAllSupportedDiseases();

        return res.status(200).json({
            success: true,
            message: 'Supported diseases retrieved successfully',
            data: diseases
        });
    } catch (error) {
        next(error);
    }
};
