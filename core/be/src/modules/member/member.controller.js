import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as memberService from './member.service.js';

/** GET /members */
export const list = async (req, res) => {
  const { items, meta } = await memberService.list(req.validated.query);

  sendSuccess(res, {
    data: items,
    meta,
  });
};

/** POST /members */
export const create = async (req, res) => {
  const member = await memberService.create(req.validated.body, req.user);
  sendCreated(res, member, 'Đăng ký hội viên thành công');
};
