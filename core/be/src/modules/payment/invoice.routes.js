import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
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
export default router;
