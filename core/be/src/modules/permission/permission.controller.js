import { sendSuccess } from '../../common/utils/api-response.js';
import * as permissionService from './permission.service.js';

/** GET /permissions - danh sach permission nhom theo module */
export const list = async (_req, res) => {
  const data = await permissionService.listGrouped();
  sendSuccess(res, { data });
};
