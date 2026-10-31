import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../validators/auth.validator.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// POST /api/v1/auth/register — rate limited to mitigate mass registration abuse
router.post('/register', authRateLimiter, validateRequest(validateRegister), register);

// POST /api/v1/auth/login — rate limited to mitigate brute force & credential stuffing
router.post('/login', authRateLimiter, validateRequest(validateLogin), login);

// GET /api/v1/auth/me — authenticated profile retrieval
router.get('/me', protect, getProfile);

// PATCH /api/v1/auth/profile — authenticated profile updates
router.patch('/profile', protect, validateRequest(validateProfileUpdate), updateProfile);

export default router;
