import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { ERROR_CODES } from '@scms/shared';
const TICK_MS = 1000;
/** Thời gian còn lại lấy từ lockedUntil của server, không hardcode số phút khóa. */
export function LoginErrorNotice({ error }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  if (!error) return null;
  const locked = error.code === ERROR_CODES.LOGIN_TEMPORARILY_LOCKED;
  const remaining = Math.max(
    0,
    Math.ceil((new Date(error.details?.lockedUntil).getTime() - now) / TICK_MS),
  );
  return (
    <Alert
      showIcon
      type="error"
      title={error.message}
      description={
        locked &&
        (remaining
          ? `Thử lại sau ${remaining} giây hoặc dùng Quên mật khẩu.`
          : 'Đã hết thời gian chờ, bạn có thể thử lại.')
      }
    />
  );
}
