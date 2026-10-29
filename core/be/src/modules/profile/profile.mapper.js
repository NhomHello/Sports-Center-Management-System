const COACH_DEFAULTS = Object.freeze({
  bio: '',
  experienceYears: 0,
  certifications: [],
  publicEmail: null,
  publicPhone: null,
  zalo: null,
  showContact: false,
});
const MEMBER_DEFAULTS = Object.freeze({
  gender: null,
  heightCm: null,
  weightKg: null,
  goals: '',
  level: 'BEGINNER',
  healthNotes: '',
  emergencyName: null,
  emergencyPhone: null,
  shareWithCoach: false,
});
const project = (source, defaults) =>
  Object.fromEntries(Object.keys(defaults).map((key) => [key, source?.[key] ?? defaults[key]]));
/** Không trả blob ảnh hoặc dữ liệu tài khoản đăng nhập cho client. */
export const coachProfileView = (profile, email) => ({
  ...project(profile, COACH_DEFAULTS),
  publicEmail: profile ? profile.publicEmail : email,
  hasAvatar: Boolean(profile?.avatarMime),
  avatarUpdatedAt: profile?.updatedAt ?? null,
});
/** Chỉ dùng cho chính chủ/nhân viên; HLV đi qua bộ lọc đồng ý chia sẻ ở service. */
export const memberProfileView = (profile) => ({
  ...project(profile, MEMBER_DEFAULTS),
  birthDate: profile?.birthDate?.toISOString().split('T')[0] ?? null,
});
