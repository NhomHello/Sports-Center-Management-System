import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { authenticateSepay } from './sepay-auth.middleware.js';
import * as controller from './sepay.controller.js';
import { sepayWebhookSchema } from './sepay.validation.js';

const router = Router();

// Public: SePay không có JWT, xác thực bằng API key riêng.
router.post('/webhook', authenticateSepay, validate(sepayWebhookSchema), controller.receiveWebhook);
export default router;
