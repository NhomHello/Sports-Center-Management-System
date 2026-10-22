import { sendSuccess } from '../../common/utils/api-response.js';
import { applyCredit as apply } from './credit-apply.service.js';
import { getCredit } from './credit.service.js';

/** GET /me/credit */
export const ownCredit = async (req, res) =>
  sendSuccess(res, { data: await getCredit(req.user.id, req.validated.query) });

/** GET /members/:id/credit */
export const memberCredit = async (req, res) =>
  sendSuccess(res, { data: await getCredit(req.validated.params.id, req.validated.query) });

/** POST /invoices/:id/apply-credit */
export const applyCredit = async (req, res) =>
  sendSuccess(res, {
    data: await apply(req.validated.params.id, req.validated.body, {
      user: req.user,
      permissions: req.permissions,
    }),
    message: 'Đã trừ số dư vào hoá đơn',
  });
