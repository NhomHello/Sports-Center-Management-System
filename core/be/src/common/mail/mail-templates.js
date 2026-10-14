const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);

const buttonHtml = (link, label) =>
  `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#1677ff;color:#fff;border-radius:6px;text-decoration:none">${label}</a></p>
    <p>Hoặc dán liên kết này vào trình duyệt:<br>${escapeHtml(link)}</p>`;

/** Khung chung của email có link dùng một lần. */
const buildLinkEmail = ({
  subject,
  fullName,
  intro,
  link,
  ttlMinutes,
  ignoreNote,
  buttonLabel,
}) => ({
  subject,
  text: [
    `Xin chào ${fullName},`,
    '',
    `${intro} (có hiệu lực ${ttlMinutes} phút, dùng một lần):`,
    link,
    '',
    ignoreNote,
  ].join('\n'),
  html: `
    <p>Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
    <p>${escapeHtml(intro)}. Liên kết có hiệu lực <strong>${ttlMinutes} phút</strong> và chỉ dùng được một lần.</p>
    ${buttonHtml(link, buttonLabel)}
    <p style="color:#888">${escapeHtml(ignoreNote)}</p>`,
});

/** Email đặt lại mật khẩu (quên mật khẩu). */
export const buildPasswordResetEmail = ({ fullName, link, ttlMinutes, centerName }) =>
  buildLinkEmail({
    subject: `[${centerName}] Đặt lại mật khẩu`,
    fullName,
    intro: 'Vui lòng mở liên kết sau để đặt mật khẩu mới',
    link,
    ttlMinutes,
    ignoreNote:
      'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này; mật khẩu hiện tại vẫn giữ nguyên.',
    buttonLabel: 'Đặt mật khẩu mới',
  });

/** Email xác nhận địa chỉ email mới khi hội viên đổi email. */
export const buildEmailChangeEmail = ({ fullName, link, ttlMinutes, centerName }) =>
  buildLinkEmail({
    subject: `[${centerName}] Xác nhận email mới`,
    fullName,
    intro: 'Vui lòng mở liên kết sau để xác nhận đây là email mới của tài khoản',
    link,
    ttlMinutes,
    ignoreNote:
      'Nếu bạn không yêu cầu đổi email, hãy bỏ qua email này; email hiện tại vẫn giữ nguyên.',
    buttonLabel: 'Xác nhận email mới',
  });

/**
 * Email xác minh địa chỉ email sau khi đăng ký.
 * @param {{ fullName: string, link: string, ttlMinutes: number, centerName: string }} data
 * @returns {{ subject: string, html: string, text: string }}
 */
export const buildVerificationEmail = ({ fullName, link, ttlMinutes, centerName }) => {
  const subject = `[${centerName}] Xác minh địa chỉ email của bạn`;
  const text = [
    `Xin chào ${fullName},`,
    '',
    `Vui lòng mở liên kết sau để xác minh email (có hiệu lực ${ttlMinutes} phút, dùng một lần):`,
    link,
    '',
    'Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.',
  ].join('\n');
  const html = `
    <p>Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
    <p>Vui lòng bấm nút bên dưới để xác minh email.
       Liên kết có hiệu lực <strong>${ttlMinutes} phút</strong> và chỉ dùng được một lần.</p>
    <p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#1677ff;color:#fff;border-radius:6px;text-decoration:none">Xác minh email</a></p>
    <p>Hoặc dán liên kết này vào trình duyệt:<br>${escapeHtml(link)}</p>
    <p style="color:#888">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>`;
  return { subject, html, text };
};
