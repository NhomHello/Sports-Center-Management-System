import { sendCreated } from '../../common/utils/api-response.js';
import * as classService from './class.service.js';

/**
 * Tao lop hoc moi.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const create = async (req, res) => {
  const item = await classService.create(req.validated.body, req.user);

  sendCreated(res, item);
};
