/** Chuẩn hoá các trường tài khoản theo hợp đồng API trước khi gửi. */
export const normalizeAccountFields = ({ fullName, email, phone }) => ({
  ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
  ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
  ...(phone?.trim() ? { phone: phone.trim() } : {}),
});

/** Bỏ trường xác nhận mật khẩu và chuẩn hoá thông tin đăng ký. */
export const normalizeRegistrationPayload = ({
  confirmPassword: _confirm,
  password,
  ...fields
}) => ({
  ...normalizeAccountFields(fields),
  password,
});

/** Hồ sơ cho phép bỏ số điện thoại tùy chọn; gửi null để API thực sự xóa giá trị cũ. */
export const normalizeOwnProfilePayload = ({ phone, ...fields }) => ({
  ...normalizeAccountFields(fields),
  ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
});
