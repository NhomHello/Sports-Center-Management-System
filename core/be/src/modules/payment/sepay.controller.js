import { sendSuccess } from '../../common/utils/api-response.js';
import { processSepayWebhook } from './sepay-webhook.service.js';

/** POST /payments/sepay/webhook; SePay chỉ cần HTTP 2xx + {"success": true} để ngừng gửi lại. */
export const receiveWebhook = async (req, res) =>
  sendSuccess(res, { data: await processSepayWebhook(req.validated.body) });
