/** Giới hạn kỹ thuật cho hồ sơ; số nghiệp vụ nằm trong system_settings. */
export const PROFILE_LIMITS = Object.freeze({
  AVATAR_BYTES: 2 * 1024 * 1024,
  BIO_STORAGE_MAX: 10000,
  EXPERIENCE_MAX: 80,
  CERTIFICATE_MAX: 30,
  CERTIFICATE_LENGTH: 300,
  TEXT_MAX: 2000,
  RATING_LIMIT: 10,
  HEIGHT_MIN: 30,
  HEIGHT_MAX: 300,
  WEIGHT_MIN: 1,
  WEIGHT_MAX: 600,
});
export const PROFILE_LEVELS = Object.freeze(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export const PROFILE_GENDERS = Object.freeze(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']);
export const REPORT_GROUPS = Object.freeze(['day', 'week', 'month', 'quarter', 'year']);
