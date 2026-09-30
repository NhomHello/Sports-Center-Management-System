import { sendSuccess } from '../../common/utils/api-response.js';
import * as membershipService from './membership.service.js';

/** GET /memberships/member/:memberId/current */
export const getCurrentByMemberId = async (req, res) => {
  const data = await membershipService.getCurrentByMemberId(req.validated.params.memberId);

  sendSuccess(res, { data });
};

/** POST /memberships/purchase */
export const purchaseOrRenew = async (req, res) => {
  const data = await membershipService.purchaseOrRenew(req.validated.body);

  sendSuccess(res, {
    data,
    message: 'Mua hoặc gia hạn gói tập thành công',
  });
};
