import { sendSuccess } from '../../common/utils/api-response.js';
import * as membershipPlanService from './membership-plan.service.js';

/** GET /membership-plans */
export const list = async (req, res) => {
  const { data, meta } = await membershipPlanService.list(req.validated.query);

  sendSuccess(res, { data, meta });
};
