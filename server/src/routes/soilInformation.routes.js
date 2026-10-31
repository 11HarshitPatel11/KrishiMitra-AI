import express from 'express';
import {
    createSoilInformation,
    getSoilInformationByUser,
    getSoilInformationByFarm,
    getSoilInformationById,
    updateSoilInformation,
    deleteSoilInformation
} from '../controllers/soilInformation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateSoilInformationInput } from '../validators/soilInformation.validator.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.post('/', validateSoilInformationInput, createSoilInformation);
router.get('/', getSoilInformationByUser);
router.get('/farm/:farmId', getSoilInformationByFarm);
router.get('/:id', getSoilInformationById);
router.patch('/:id', validateSoilInformationInput, updateSoilInformation);
router.delete('/:id', deleteSoilInformation);

export default router;
