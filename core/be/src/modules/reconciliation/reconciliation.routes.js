import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './reconciliation.controller.js';
import * as schema from './reconciliation.validation.js';

/** /reconciliations: hàng chờ đối soát SePay (UC-PAY-11..14), chỉ người có payment.reconcile. */
export const reconciliationRoutes = Router();
reconciliationRoutes.use(authenticate, authorize(PERMISSIONS.PAYMENT_RECONCILE));
reconciliationRoutes.get('/', validate(schema.caseListSchema), controller.listCases);
reconciliationRoutes.get('/summary', controller.summary);
reconciliationRoutes.post('/sync', validate(schema.syncSchema), controller.sync);
reconciliationRoutes.get('/:id', validate(schema.caseParamsSchema), controller.getCase);
reconciliationRoutes.post('/:id/contacts', validate(schema.contactSchema), controller.addContact);
reconciliationRoutes.post('/:id/map', validate(schema.mapSchema), controller.mapCase);
reconciliationRoutes.post('/:id/confirm', validate(schema.confirmSchema), controller.confirmCase);
reconciliationRoutes.post('/:id/renew', validate(schema.renewSchema), controller.renewFromCase);
reconciliationRoutes.post(
  '/:id/accept',
  validate(schema.caseParamsSchema),
  controller.acceptOverpaid,
);
reconciliationRoutes.post(
  '/:id/refund',
  validate(schema.refundRequestSchema),
  controller.requestCaseRefund,
);
reconciliationRoutes.post('/:id/reject', validate(schema.noteSchema), controller.rejectClaim);
reconciliationRoutes.post('/:id/ignore', validate(schema.noteSchema), controller.ignoreCase);

/** /refunds: theo dõi và xác nhận đã chuyển trả (BR-PAY-13). */
export const refundRoutes = Router();
refundRoutes.use(authenticate, authorize(PERMISSIONS.PAYMENT_REFUND));
refundRoutes.get('/', validate(schema.refundListSchema), controller.listRefunds);
refundRoutes.post(
  '/:id/complete',
  validate(schema.refundCompleteSchema),
  controller.completeRefund,
);
