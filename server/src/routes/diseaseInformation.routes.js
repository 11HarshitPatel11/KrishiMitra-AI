import express from 'express';
import { getDiseaseInformation, getSupportedDiseases } from '../controllers/diseaseInformation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getSupportedDiseases);
router.get('/:diseaseCode', protect, getDiseaseInformation);

export default router;
