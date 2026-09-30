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

/** GET /members/:id */
export const getById = async (req, res) => {
  const member = await memberService.getById(req.validated.params.id);
  sendSuccess(res, { data: member });
};

/** POST /members */
export const create = async (req, res) => {
  const member = await memberService.create(req.validated.body, req.user);
  sendCreated(res, member, 'Đăng ký hội viên thành công');
};

/** PUT /members/:id */
export const update = async (req, res) => {
  const member = await memberService.update(req.validated.params.id, req.validated.body, req.user);

  sendSuccess(res, {
    data: member,
    message: 'Cập nhật hội viên thành công',
  });
};
