import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as readService from './class-read.service.js';
import * as classService from './class.service.js';

/**
 * Tao lop hoc.
 */
export const create = async (req, res) => {
  const item = await classService.create(req.validated.body, req.user);
  sendCreated(res, item);
};

/**
 * Lay danh sach lop dang mo.
 */
export const list = async (req, res) => {
  const result = await readService.listOpenClasses(req.validated.query);
  sendSuccess(res, result);
};

/**
 * Lay chi tiet lop hoc.
 */
export const getById = async (req, res) => {
  const item = await readService.getById(req.validated.params.id);
  sendSuccess(res, { data: item });
};
