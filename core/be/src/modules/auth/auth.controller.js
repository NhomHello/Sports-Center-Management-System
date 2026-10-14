import { StatusCodes } from 'http-status-codes';
import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as authService from './auth.service.js';
import * as emailVerificationService from './email-verification.service.js';
import * as passwordResetService from './password-reset.service.js';
import * as supportContactService from './support-contact.service.js';

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

/** POST /auth/password-changes; không trả hoặc lưu mật khẩu trong response/audit. */
export const changePassword = async (req, res) => {
  const data = await authService.changePassword(req.user.id, req.validated.body);
  sendSuccess(res, { data, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
};

/** POST /auth/email-verifications; luôn trả 202 để không lộ email đã đăng ký. */
export const requestEmailVerification = async (req, res) => {
  await emailVerificationService.requestVerification(req.validated.body);
  sendSuccess(res, {
    message: 'Nếu email tồn tại và chưa xác minh, chúng tôi đã gửi liên kết xác minh.',
    status: StatusCodes.ACCEPTED,
  });
};

/** POST /auth/email-verifications/confirm */
export const confirmEmailVerification = async (req, res) => {
  const data = await emailVerificationService.confirmVerification(req.validated.body);
  sendSuccess(res, { data, message: 'Xác minh email thành công' });
};

/** POST /auth/password-resets; luôn trả 202 để không lộ email đã đăng ký. */
export const requestPasswordReset = async (req, res) => {
  await passwordResetService.requestPasswordReset(req.validated.body);
  sendSuccess(res, {
    message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.',
    status: StatusCodes.ACCEPTED,
  });
};

/** POST /auth/password-resets/confirm */
export const confirmPasswordReset = async (req, res) => {
  await passwordResetService.confirmPasswordReset(req.validated.body);
  sendSuccess(res, { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' });
};

/** GET /auth/support-contacts; công khai để màn đăng nhập/xác minh hiện kênh liên hệ. */
export const getSupportContacts = async (_req, res) =>
  sendSuccess(res, { data: await supportContactService.getSupportContacts() });
