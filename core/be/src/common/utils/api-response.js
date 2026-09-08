import { StatusCodes } from 'http-status-codes';

/**
 * Chuan response thanh cong: { success: true, message, data, meta? }
 * Moi controller PHAI tra ve qua ham nay de FE xu ly thong nhat.
 * @param {import('express').Response} res
 * @param {{ data?: unknown, message?: string, meta?: object, status?: number }} [options]
 */
export const sendSuccess = (
  res,
  { data = null, message = 'OK', meta, status = StatusCodes.OK } = {},
) => res.status(status).json({ success: true, message, data, ...(meta && { meta }) });

/**
 * Response 201 sau khi tao moi.
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {string} [message]
 */
export const sendCreated = (res, data, message = 'Tạo thành công') =>
  sendSuccess(res, { data, message, status: StatusCodes.CREATED });

/**
 * Response 204 sau khi xoa.
 * @param {import('express').Response} res
 */
export const sendNoContent = (res) => res.status(StatusCodes.NO_CONTENT).send();
