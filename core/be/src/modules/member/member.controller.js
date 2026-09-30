import { sendCreated } from '../../common/utils/api-response.js';
import * as memberService from './member.service.js';

/** POST /members */
export const create = async (req, res) => {
  const member = await memberService.create(req.validated.body, req.user);
  sendCreated(res, member, 'Đăng ký hội viên thành công');
};
