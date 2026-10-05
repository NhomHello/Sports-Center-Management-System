import { ERROR_CODES } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { AUTH } from '../../constants/index.js';
import { ApiError } from '../errors/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';

const TOKEN_EXPIRED_ERROR = 'TokenExpiredError';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  status: true,
  roleId: true,
  tokenVersion: true,
};

/**
 * Lay token tu header "Authorization: Bearer <token>".
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  const header = req.headers[AUTH.HEADER];
  const prefix = `${AUTH.SCHEME} `;
  if (typeof header !== 'string' || !header.startsWith(prefix)) return null;
  return header.slice(prefix.length).trim() || null;
};

/**
 * @param {string} token
 * @returns {{ sub: number }}
 */
const decodeOrThrow = (token) => {
  try {
    return verifyAccessToken(token);
  } catch (err) {
    if (err.name === TOKEN_EXPIRED_ERROR) {
      throw ApiError.unauthorized('Phiên đăng nhập đã hết hạn', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw ApiError.unauthorized('Token không hợp lệ');
  }
};

/**
 * Middleware xac thuc: gan req.user = { id, email, fullName, status, roleId }.
 * Dung cho MOI route can dang nhap. Express 5 tu bat loi async.
 * @type {import('express').RequestHandler}
 */
export const authenticate = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  const payload = decodeOrThrow(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: USER_SELECT });
  if (!user) throw ApiError.unauthorized('Tài khoản không tồn tại');
  if ((payload.version ?? 0) !== user.tokenVersion) {
    throw ApiError.unauthorized('Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.');
  }
  if (user.status !== Enums.UserStatus.ACTIVE) {
    throw ApiError.forbidden('Tài khoản đã bị khoá', ERROR_CODES.ACCOUNT_INACTIVE);
  }

  req.user = user;
  next();
};
