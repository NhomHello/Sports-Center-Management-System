import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { env } from '../../config/env.js';
import { TIME } from '../../constants/index.js';
import * as controller from './auth.controller.js';
import { loginSchema, passwordChangeSchema, registerSchema } from './auth.validation.js';

const router = Router();

// Chong brute-force: gioi han rieng cho login/register
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * TIME.MS_PER_MINUTE,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post(
  '/password-changes',
  authenticate,
  validate(passwordChangeSchema),
  controller.changePassword,
);
router.get('/me', authenticate, controller.me);

export default router;
