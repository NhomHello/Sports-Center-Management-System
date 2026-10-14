import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import { createClaim } from './payment-claim.service.js';
import * as refundService from './refund.service.js';
import * as resolveService from './reconciliation-resolve.service.js';
import * as caseService from './reconciliation.service.js';
import { syncFromSepay } from './sepay-sync.service.js';

const caseId = (req) => req.validated.params.id;

/** GET /reconciliations */
export const listCases = async (req, res) => {
  const { items, meta } = await caseService.listCases(req.validated.query);
  sendSuccess(res, { data: items, meta });
};

/** GET /reconciliations/summary: số phiếu cho badge cảnh báo. */
export const summary = async (_req, res) => sendSuccess(res, { data: await caseService.summary() });

/** GET /reconciliations/:id */
export const getCase = async (req, res) =>
  sendSuccess(res, { data: await caseService.getCase(caseId(req)) });

/** POST /reconciliations/:id/contacts */
export const addContact = async (req, res) =>
  sendCreated(
    res,
    await caseService.addContact(caseId(req), req.validated.body, req.user),
    'Đã ghi lại lần liên hệ hội viên',
  );

/** POST /reconciliations/:id/map */
export const mapCase = async (req, res) =>
  sendSuccess(res, {
    data: await resolveService.mapCase(caseId(req), req.validated.body, req.user),
    message: 'Đã gán giao dịch vào hoá đơn',
  });

/** POST /reconciliations/:id/confirm */
export const confirmCase = async (req, res) =>
  sendSuccess(res, {
    data: await resolveService.confirmCase(caseId(req), req.validated.body, req.user),
    message: 'Đã xác nhận khoản tiền',
  });

/** POST /reconciliations/:id/renew */
export const renewFromCase = async (req, res) =>
  sendSuccess(res, {
    data: await resolveService.renewFromCase(caseId(req), req.validated.body, req.user),
    message: 'Đã dùng khoản tiền để gia hạn gói',
  });

/** POST /reconciliations/:id/refund */
export const requestCaseRefund = async (req, res) =>
  sendCreated(
    res,
    await refundService.requestCaseRefund(caseId(req), req.validated.body, req.user),
    'Đã tạo yêu cầu hoàn tiền',
  );

/** POST /reconciliations/:id/reject */
export const rejectClaim = async (req, res) =>
  sendSuccess(res, {
    data: await caseService.rejectClaim(caseId(req), req.validated.body, req.user),
    message: 'Đã từ chối phiếu và báo cho hội viên',
  });

/** POST /reconciliations/:id/ignore */
export const ignoreCase = async (req, res) =>
  sendSuccess(res, {
    data: await caseService.ignoreCase(caseId(req), req.validated.body, req.user),
    message: 'Đã bỏ qua giao dịch',
  });

/** POST /reconciliations/sync */
export const sync = async (req, res) =>
  sendSuccess(res, {
    data: await syncFromSepay(req.validated.body, req.user),
    message: 'Đã đồng bộ giao dịch từ SePay',
  });

/** GET /refunds */
export const listRefunds = async (req, res) => {
  const { items, meta } = await refundService.listRefunds(req.validated.query);
  sendSuccess(res, { data: items, meta });
};

/** POST /refunds/:id/complete */
export const completeRefund = async (req, res) =>
  sendSuccess(res, {
    data: await refundService.completeRefund(caseId(req), req.validated.body, req.user),
    message: 'Đã ghi nhận chuyển trả tiền',
  });

/** POST /invoices/:id/refund */
export const refundInvoice = async (req, res) =>
  sendCreated(
    res,
    await refundService.refundInvoice(caseId(req), req.validated.body, req.user),
    'Đã chuyển hoá đơn sang hoàn tiền',
  );

/** POST /invoices/:id/claims: hội viên báo đã chuyển khoản. */
export const createPaymentClaim = async (req, res) =>
  sendCreated(
    res,
    await createClaim(caseId(req), req.validated.body, req.user),
    'Đã gửi thông tin chuyển khoản, trung tâm sẽ đối chiếu',
  );
