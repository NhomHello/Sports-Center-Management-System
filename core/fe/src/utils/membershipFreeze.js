const RANGE_SIZE = 2;
/** Không dựng giới hạn dự phòng khi API chưa trả đủ ngân sách bảo lưu. */
export const getFreezeLimits = (membership) => {
  if (!membership) return null;
  const { freezeMinDays: minDays, freezeDaysUsed: used, freezeDaysLeft: left } = membership;
  if ([minDays, used, left].some((value) => !Number.isInteger(value) || value < 0) || minDays < 1)
    return null;
  return { minDays, used, left, total: used + left };
};
/** Chặn khoảng ngoài giới hạn live trước khi gọi API; backend vẫn là nơi quyết định cuối cùng. */
export const getFreezeRangeError = (dates, limits) => {
  if (!limits) return 'Chưa tải đủ giới hạn bảo lưu';
  if (!dates || dates.length !== RANGE_SIZE || dates.some((date) => !date))
    return 'Chọn khoảng bảo lưu';
  const days = dates[1].diff(dates[0], 'day');
  return days < limits.minDays || days > limits.left
    ? `Chọn từ ${limits.minDays} đến ${limits.left} ngày`
    : null;
};
