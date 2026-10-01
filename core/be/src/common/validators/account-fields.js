import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

/** Chuẩn hóa trước khi validate để email có khoảng trắng vẫn được nhập hợp lệ. */
export const emailField = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'));

/** BR-1.10: số +84 và số 0 cùng định danh, lưu một dạng chuẩn để chống trùng. */
export const phoneField = z
  .string()
  .trim()
  .regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ')
  .transform((value) => value.replace(/^\+84/, '0'));

/** Họ tên được chuẩn hóa trước khi kiểm tra chiều dài. */
export const fullNameField = z
  .string()
  .trim()
  .min(VALIDATION.NAME_MIN_LENGTH, 'Họ tên quá ngắn')
  .max(VALIDATION.NAME_MAX_LENGTH, 'Họ tên quá dài');

/** Mật khẩu giữ nguyên ký tự, không trim hoặc ghi vào log. */
export const passwordField = z
  .string()
  .min(VALIDATION.PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`)
  .max(VALIDATION.PASSWORD_MAX_LENGTH, 'Mật khẩu vượt quá độ dài cho phép');
