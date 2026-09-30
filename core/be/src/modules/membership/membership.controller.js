import { sendSuccess } from '../../common/utils/api-response.js';
import * as membershipService from './membership.service.js';

/** GET /memberships/member/:memberId/current */
export const getCurrentByMemberId = async (req, res) => {
  const data = await membershipService.getCurrentByMemberId(req.validated.params.memberId);

  sendSuccess(res, { data });
};
