import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as authService from './auth.service.js';

/** POST /auth/login */
export const login = async (req, res) => {
  const data = await authService.login(req.validated.body, { ip: req.ip });
  sendSuccess(res, { data, message: 'Đăng nhập thành công' });
};

/** POST /auth/register */
export const register = async (req, res) => {
  const user = await authService.register(req.validated.body);
  sendCreated(res, user, 'Đăng ký thành công');
};

/** GET /auth/me */
export const me = async (req, res) => {
  const data = await authService.getMe(req.user.id);
  sendSuccess(res, { data });
};
