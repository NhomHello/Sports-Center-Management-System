import { ERROR_CODES } from '@scms/shared';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { env } from '../../config/env.js';
import { TIME } from '../../constants/index.js';
import * as controller from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  requestEmailVerificationSchema,
  confirmEmailVerificationSchema,
} from './auth.validation.js';

const router = Router();

// Chong brute-force: gioi han rieng cho login/register
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * TIME.MS_PER_MINUTE,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    code: ERROR_CODES.RATE_LIMITED,
    message: `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${env.RATE_LIMIT_WINDOW_MINUTES} phút.`,
  },
});

router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.get('/me', authenticate, controller.me);
router.post(
  '/password-changes',
  authenticate,
  authLimiter,
  validate(changePasswordSchema),
  controller.changePassword,
);

router.post(
  '/email-verifications',
  authLimiter,
  validate(requestEmailVerificationSchema),
  controller.requestEmailVerification,
);
router.post(
  '/email-verifications/confirm',
  authLimiter,
  validate(confirmEmailVerificationSchema),
  controller.confirmEmailVerification,
);

export default router;
