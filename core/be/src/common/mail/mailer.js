import nodemailer from 'nodemailer';
import { logger } from '../../config/logger.js';
import { env, isProd } from '../../config/env.js';

/** @type {import('nodemailer').Transporter | null} */
let transporter = null;

/** Tạo transporter một lần; null khi chưa cấu hình MAIL_HOST. */
const getTransporter = () => {
  if (!env.MAIL_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    ...(env.MAIL_USER && { auth: { user: env.MAIL_USER, pass: env.MAIL_PASS } }),
  });
  return transporter;
};

/**
 * Gửi email qua SMTP (Mailtrap / Brevo / Gmail đều dùng được, chỉ đổi biến MAIL_*).
 * Chưa cấu hình MAIL_HOST: không gửi thật, chỉ ghi nội dung ra log để dev lấy link khi chạy local.
 * @param {{ to: string, subject: string, html: string, text: string }} message
 * @returns {Promise<{ delivered: boolean }>}
 */
export const sendMail = async ({ to, subject, html, text }) => {
  const smtp = getTransporter();
  if (!smtp) {
    logger.warn(
      { to, subject, ...(!isProd && { text }) },
      'MAIL_HOST chưa cấu hình: bỏ qua gửi email, chỉ ghi log',
    );
    return { delivered: false };
  }
  await smtp.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
  return { delivered: true };
};
