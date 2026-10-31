import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { validateMarketQuery } from '../validators/market.validator.js';
import { getMarketInfo } from '../controllers/market.controller.js';

const router = Router();

router.get('/', protect, validateMarketQuery, getMarketInfo);

export default router;
