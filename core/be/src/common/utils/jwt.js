import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

/**
 * Ky access token. Payload toi thieu: { sub: userId }. KHONG bo role/permission vao token
 * (quyen doc tu DB moi request de doi quyen co hieu luc ngay).
 * @param {{ sub: number, ver?: number }} payload
 * @returns {string}
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Xac thuc token, nem loi cua jsonwebtoken neu sai/het han.
 * @param {string} token
 * @returns {{ sub: number, ver?: number, iat: number, exp: number }}
 */
export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);
