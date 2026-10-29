export const PROFILE_LEVELS = Object.freeze([
  { value: 'BEGINNER', label: 'Mới bắt đầu' },
  { value: 'INTERMEDIATE', label: 'Trung bình' },
  { value: 'ADVANCED', label: 'Nâng cao' },
]);
export const PROFILE_GENDERS = Object.freeze([
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
  { value: 'UNDISCLOSED', label: 'Không cung cấp' },
]);
export const COURSE_RESULT_LABELS = Object.freeze({ PASS: 'Đạt', NOT_PASSED: 'Chưa đạt' });
export const PROFILE_KEYS = Object.freeze({
  OWN_COACH: ['coach-profile-own'],
  OWN_MEMBER: ['member-profile-own'],
  COACHES: ['coach-directory'],
  STUDENTS: ['coach-students'],
});
