import { PERMISSIONS } from '@scms/shared';
import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as invoiceService from './invoice.service.js';
import * as paymentService from './payment.service.js';

const canReadAllInvoices = (req) =>
  req.permissions.has(PERMISSIONS.INVOICE_READ_ALL) ||
  req.permissions.has(PERMISSIONS.INVOICE_EXPORT);

/** GET /invoices/:id */
export const getInvoice = async (req, res) => {
  const data = await invoiceService.getInvoice(
    req.validated.params.id,
    req.user,
    canReadAllInvoices(req),
  );
  sendSuccess(res, { data });
};

/** GET /invoices/:id/receipt */
export const getReceipt = async (req, res) => {
  const data = await invoiceService.getReceipt(
    req.validated.params.id,
    req.user,
    canReadAllInvoices(req),
  );
  sendSuccess(res, { data });
};

/** POST /payments/invoices/:invoiceId/cash */
export const collectCash = async (req, res) => {
  const data = await paymentService.collectCash(
    req.validated.params.invoiceId,
    req.validated.body,
    req.user,
  );
  sendCreated(res, data, 'Đã ghi nhận thanh toán tại quầy');
};
