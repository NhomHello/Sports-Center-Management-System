import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as reconciliation from '../reconciliation/reconciliation.controller.js';
import { claimSchema, refundRequestSchema } from '../reconciliation/reconciliation.validation.js';
import * as controller from './payment.controller.js';
import { invoiceListSchema, invoiceParamsSchema } from './payment.validation.js';

const router = Router();
router.use(authenticate);
router.get(
  '/me',
  authorize(PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL),
  validate(invoiceListSchema),
  controller.listOwnInvoices,
);
router.get(
  '/',
  authorize(PERMISSIONS.INVOICE_READ_ALL),
  validate(invoiceListSchema),
  controller.listInvoices,
);
router.get(
  '/:id/receipt',
  authorize(PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_EXPORT),
  validate(invoiceParamsSchema),
  controller.getReceipt,
);
router.get(
  '/:id',
  authorize(PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL),
  validate(invoiceParamsSchema),
  controller.getInvoice,
);
// UC-PAY-14: hội viên báo đã chuyển khoản cho hoá đơn của chính mình.
router.post(
  '/:id/claims',
  authorize(PERMISSIONS.PAYMENT_CHECKOUT),
  validate(claimSchema),
  reconciliation.createPaymentClaim,
);
// UC-PAY-09: hoàn tiền một hoá đơn đã thanh toán.
router.post(
  '/:id/refund',
  authorize(PERMISSIONS.PAYMENT_REFUND),
  validate(refundRequestSchema),
  reconciliation.refundInvoice,
);
export default router;
