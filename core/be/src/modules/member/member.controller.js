import { sendSuccess } from '../../common/utils/api-response.js';
import * as memberService from './member.service.js';

/** GET /members/me */
export const getOwn = async (req, res) => {
  const data = await memberService.getOwn(req.user.id);
  sendSuccess(res, { data });
};

/** PATCH /members/me */
export const updateOwn = async (req, res) => {
  const data = await memberService.updateOwn(req.user.id, req.validated.body);
  sendSuccess(res, { data, message: 'Cập nhật hồ sơ thành công' });
};
