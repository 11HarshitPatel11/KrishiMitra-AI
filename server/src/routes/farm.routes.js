import { Router } from 'express';
import {
    createFarm,
    getAllFarms,
    getFarmById,
    updateFarm,
    deleteFarm,
    reverseGeocodeFarmLocation,
} from '../controllers/farm.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { validateFarmCreation, validateFarmUpdate } from '../validators/farm.validator.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/farms
router.post('/', protect, validateRequest(validateFarmCreation), createFarm);

// GET /api/v1/farms
router.get('/', protect, getAllFarms);

// GET /api/v1/farms/reverse-geocode (defined BEFORE /:id)
router.get('/reverse-geocode', protect, reverseGeocodeFarmLocation);

// GET /api/v1/farms/:id
router.get('/:id', protect, getFarmById);

// PATCH /api/v1/farms/:id
router.patch('/:id', protect, validateRequest(validateFarmUpdate), updateFarm);

// DELETE /api/v1/farms/:id
router.delete('/:id', protect, deleteFarm);

export default router;
