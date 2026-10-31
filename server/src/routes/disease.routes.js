import express from 'express';
import { predictDisease } from '../controllers/disease.controller.js';
import { validateDiseaseImage } from '../validators/disease.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/predict', protect, validateDiseaseImage, predictDisease);

export default router;
