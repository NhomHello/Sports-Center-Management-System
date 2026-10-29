/** Giới hạn giao thức/kỹ thuật; ngưỡng nghiệp vụ đọc từ system settings. */
export const COURSE_LIMITS = Object.freeze({
  MIN_STARS: 1,
  MAX_STARS: 5,
  TEXT_LENGTH: 2000,
  REASON_LENGTH: 1000,
  PERCENT_SCALE: 10000,
  PRECISION: 100,
  BATCH_SIZE: 50,
});
export const COURSE_EVENTS = Object.freeze({ PUBLISHED: 'COURSE_SUMMARY_PUBLISHED' });
