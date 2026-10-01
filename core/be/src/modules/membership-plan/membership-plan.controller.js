import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as membershipPlanService from './membership-plan.service.js';

/** GET /membership-plans */
export const list = async (req, res) => {
  const { data, meta } = await membershipPlanService.list(req.validated.query);

  sendSuccess(res, { data, meta });
};

/** GET /membership-plans/selling */
export const listSelling = async (req, res) => {
  const data = await membershipPlanService.listSelling();

  sendSuccess(res, { data });
};

/** GET /membership-plans/:id */
export const getById = async (req, res) => {
  const data = await membershipPlanService.getById(req.validated.params.id);

  sendSuccess(res, { data });
};

/** POST /membership-plans */
export const create = async (req, res) => {
  const data = await membershipPlanService.create(req.validated.body, req.user);

  sendCreated(res, data, 'Tạo gói tập thành công');
};

/** PUT /membership-plans/:id */
export const update = async (req, res) => {
  const data = await membershipPlanService.update(
    req.validated.params.id,
    req.validated.body,
    req.user,
  );

  sendSuccess(res, {
    data,
    message: 'Cập nhật gói tập thành công',
  });
};

/** DELETE /membership-plans/:id */
export const remove = async (req, res) => {
  const data = await membershipPlanService.remove(req.validated.params.id, req.user);

  sendSuccess(res, {
    data,
    message: data ? 'Đã ngừng bán gói tập' : 'Đã xoá gói tập',
  });
};
