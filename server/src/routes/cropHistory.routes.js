import { Router } from 'express';
import {
    createCropHistory,
    getCropHistories,
    getCropHistoriesByFarm,
    getCropHistoryById,
    updateCropHistory,
    deleteCropHistory
} from '../controllers/cropHistory.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { validateCropHistoryCreation, validateCropHistoryUpdate } from '../validators/cropHistory.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Order matters: farm specific routes first
router.get('/farm/:farmId', protect, getCropHistoriesByFarm);

// General routes
router.post('/', protect, validateRequest(validateCropHistoryCreation), createCropHistory);
router.get('/', protect, getCropHistories);

router.get('/:id', protect, getCropHistoryById);
router.patch('/:id', protect, validateRequest(validateCropHistoryUpdate), updateCropHistory);
router.delete('/:id', protect, deleteCropHistory);

export default router;
