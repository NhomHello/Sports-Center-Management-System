const PERCENT_MAX = 100;
const validCount = (value) => Number.isSafeInteger(value) && value >= 0;

/** Chỉ chuẩn hóa thanh minh họa; không dùng kết quả để quyết định quyền đăng ký. */
export function classCapacity(item) {
  const { capacity, enrolledCount, heldSeats = 0, seatsRemaining } = item;
  if (
    !validCount(capacity) ||
    !capacity ||
    !validCount(enrolledCount) ||
    !validCount(heldSeats) ||
    !validCount(seatsRemaining)
  )
    return null;
  const bookedPercent = Math.min(PERCENT_MAX, (enrolledCount / capacity) * PERCENT_MAX);
  const heldPercent = Math.min(PERCENT_MAX - bookedPercent, (heldSeats / capacity) * PERCENT_MAX);
  return { capacity, enrolledCount, heldSeats, seatsRemaining, bookedPercent, heldPercent };
}
