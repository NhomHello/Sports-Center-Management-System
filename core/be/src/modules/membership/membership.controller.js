import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as membershipInvoiceService from './membership-invoice.service.js';
import * as membershipService from './membership.service.js';

/** GET /memberships/me/current */
export const getMyCurrent = async (req, res) => {
  const data = await membershipService.getCurrentByMemberId(req.user.id);

  sendSuccess(res, { data });
};

/** GET /memberships/member/:memberId/current */
export const getCurrentByMemberId = async (req, res) => {
  const data = await membershipService.getCurrentByMemberId(req.validated.params.memberId);

  sendSuccess(res, { data });
};

/** POST /memberships/me/orders */
export const createOwnOrder = async (req, res) =>
  sendCreated(
    res,
    await membershipInvoiceService.createCounterOrder(
      { memberId: req.user.id, planId: req.validated.body.planId },
      req.user,
    ),
    'Đã tạo hóa đơn chờ thanh toán',
  );
