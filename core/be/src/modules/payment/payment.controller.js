import { PERMISSIONS } from '@scms/shared';
import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as membershipService from '../membership/membership-invoice.service.js';
import * as invoiceService from './invoice.service.js';
import * as paymentService from './payment.service.js';
/** GET /invoices/:id/receipt */
export const getReceipt = async (req, res) => {
  const data = await invoiceService.getReceipt(
    req.validated.params.id,
    req.user,
    req.permissions.has(PERMISSIONS.INVOICE_READ_ALL) ||
      req.permissions.has(PERMISSIONS.INVOICE_EXPORT),
  );
  sendSuccess(res, { data });
};
/** GET /invoices; req.permissions do middleware authorize nạp từ DB. */
export const listInvoices = async (req, res) => {
  const { items, meta } = await invoiceService.listInvoices(
    req.validated.query,
    req.user,
    req.permissions.has(PERMISSIONS.INVOICE_READ_ALL),
  );
  sendSuccess(res, { data: items, meta });
};

/** GET /invoices/me luôn giới hạn chính chủ kể cả người có read_all. */
export const listOwnInvoices = async (req, res) => {
  const { items, meta } = await invoiceService.listInvoices(req.validated.query, req.user, false);
  sendSuccess(res, { data: items, meta });
};

/** GET /invoices/:id */
export const getInvoice = async (req, res) =>
  sendSuccess(res, {
    data: await invoiceService.getInvoice(
      req.validated.params.id,
      req.user,
      req.permissions.has(PERMISSIONS.INVOICE_READ_ALL),
    ),
  });

/** POST /payments/invoices/:invoiceId/cash; không nhận trường amount. */
export const collectCash = async (req, res) =>
  sendSuccess(res, {
    data: await paymentService.collectCash(req.validated.params.invoiceId, req.user),
    message: 'Đã ghi nhận tiền mặt và cập nhật gói tập',
  });

/** POST /memberships/orders: bước tạo hóa đơn cho luồng thu tiền tại quầy. */
export const createCounterOrder = async (req, res) =>
  sendCreated(
    res,
    await membershipService.createCounterOrder(req.validated.body, req.user),
    'Hóa đơn đã sẵn sàng để thu tiền',
  );
