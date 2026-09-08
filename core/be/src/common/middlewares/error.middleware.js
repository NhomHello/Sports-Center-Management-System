import { ERROR_CODES } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { isDev } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { PRISMA_ERROR } from '../../constants/index.js';
import { ApiError } from '../errors/api-error.js';
import { formatZodIssues } from './validate.middleware.js';

const PRISMA_ERROR_MAP = {
  [PRISMA_ERROR.UNIQUE_VIOLATION]: (err) =>
    ApiError.conflict('Dữ liệu đã tồn tại', { fields: err.meta?.target }),
  [PRISMA_ERROR.RECORD_NOT_FOUND]: () => ApiError.notFound(),
  [PRISMA_ERROR.FOREIGN_KEY_VIOLATION]: () =>
    ApiError.badRequest('Dữ liệu tham chiếu không tồn tại'),
};

/**
 * Dua moi loai loi ve ApiError de tra response thong nhat.
 * @param {unknown} err
 * @returns {ApiError}
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError)
    return ApiError.badRequest('Dữ liệu không hợp lệ', formatZodIssues(err));
  if (err instanceof SyntaxError && 'body' in err) return ApiError.badRequest('JSON không hợp lệ');
  const prismaMapper = PRISMA_ERROR_MAP[err?.code];
  if (prismaMapper) return prismaMapper(err);
  return new ApiError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    'Lỗi hệ thống, vui lòng thử lại sau',
  );
};

/**
 * 404 cho route khong ton tai. Dat SAU tat ca route.
 * @type {import('express').RequestHandler}
 */
export const notFoundHandler = (req) => {
  throw ApiError.notFound(`Không tìm thấy ${req.method} ${req.originalUrl}`);
};

/**
 * Error handler cuoi cung (4 tham so la bat buoc de Express nhan dien).
 * Response: { success: false, code, message, details?, stack? (chi dev) }
 * @type {import('express').ErrorRequestHandler}
 */
export const errorHandler = (err, req, res, _next) => {
  const apiError = normalizeError(err);
  const log = req.log ?? logger;
  const isServerError = apiError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR;

  if (isServerError) log.error({ err }, 'Unhandled error');
  else log.warn({ code: apiError.code, message: apiError.message }, 'Request error');

  res.status(apiError.statusCode).json({
    success: false,
    code: apiError.code,
    message: apiError.message,
    ...(apiError.details !== undefined && { details: apiError.details }),
    ...(isDev && isServerError && { stack: err.stack }),
  });
};
