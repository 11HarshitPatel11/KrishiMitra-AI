import express from 'express';
import { predictCrop } from '../controllers/recommendation.controller.js';
import { validateRecommendationInput } from '../validators/recommendation.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/predict', protect, validateRecommendationInput, predictCrop);

export default router;
