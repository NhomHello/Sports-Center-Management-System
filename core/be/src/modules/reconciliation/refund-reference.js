const REFUND_CODE = Object.freeze({ prefix: 'HT', width: 6 });
/** Mã tra cứu duy nhất theo ID, không chứa thông tin ngân hàng của hội viên. */
export const refundCode = (id) =>
  `${REFUND_CODE.prefix}${String(id).padStart(REFUND_CODE.width, '0')}`;
/** Tìm theo mã được hội viên cung cấp; không tự diễn giải mã không đúng định dạng. */
export const refundIdFromCode = (value = '') => {
  const match = /^HT(\d+)$/iu.exec(value.trim());
  const id = match ? Number(match[1]) : null;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
