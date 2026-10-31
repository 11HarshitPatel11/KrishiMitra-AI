import express from 'express';
import { getExternalSoilInformation, getStoredExternalSoilInformation } from '../controllers/soilGrids.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

// Triggers external lookups conditionally
router.get('/external/farm/:farmId', getExternalSoilInformation);

// Lookups existing local cache avoiding external calls explicitly
router.get('/external/farm/:farmId/cached', getStoredExternalSoilInformation);

export default router;
