const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);

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
