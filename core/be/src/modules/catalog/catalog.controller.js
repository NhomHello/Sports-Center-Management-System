import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';

/** Factory controller: mọi kiểm tra nghiệp vụ nằm ở catalog service. */
export const createCatalogController = (service) => ({
  async list(req, res) {
    sendSuccess(res, await service.list(req.validated.query));
  },
  async create(req, res) {
    sendCreated(res, await service.create(req.validated.body, req.user));
  },
  async update(req, res) {
    sendSuccess(res, {
      data: await service.update(req.validated.params.id, req.validated.body, req.user),
    });
  },
  async remove(req, res) {
    sendSuccess(res, {
      data: await service.update(req.validated.params.id, { isActive: false }, req.user),
    });
  },
});
