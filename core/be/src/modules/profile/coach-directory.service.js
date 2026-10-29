import { PERMISSIONS as P } from '@scms/shared';
import { prisma, Enums } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { toPrismaPage, buildPageMeta } from '../../common/utils/pagination.js';
import { PROFILE_LIMITS } from '../../constants/sprint4.js';
import { coachProfileView } from './profile.mapper.js';
import { listRatings } from '../course-summary/course-rating.service.js';
const visible = () => ({
  status: Enums.UserStatus.ACTIVE,
  role: { permissions: { some: { permission: { code: P.SCHEDULE_VIEW_TEACHING } } } },
  coachSubjects: { some: { subject: { isActive: true } } },
});
const profileSelect = {
  bio: true,
  experienceYears: true,
  certifications: true,
  publicEmail: true,
  publicPhone: true,
  zalo: true,
  showContact: true,
  avatarMime: true,
  updatedAt: true,
};
const include = {
  coachProfile: { select: profileSelect },
  coachSubjects: {
    where: { subject: { isActive: true } },
    select: { subject: { select: { id: true, name: true } } },
  },
};
const publicView = (u) => {
  const p = coachProfileView(u.coachProfile, null);
  const { publicEmail, publicPhone, zalo, showContact, ...profile } = p;
  return {
    id: u.id,
    fullName: u.fullName,
    ...profile,
    subjects: u.coachSubjects.map((s) => s.subject),
    ...(showContact && { contact: { email: publicEmail, phone: publicPhone, zalo } }),
  };
};
/** Hội viên không được phân biệt HLV đã nghỉ với hồ sơ không tồn tại. */
export const loadPublicCoach = async (id) => {
  const item = await prisma.user.findFirst({
    where: { id, ...visible() },
    select: { id: true, fullName: true, ...include },
  });
  if (!item) throw ApiError.notFound('Không tìm thấy huấn luyện viên');
  return item;
};
/** Thẻ HLV chỉ có DTO công khai, đếm và điểm trung bình bằng truy vấn gộp. */
export const listCoaches = async (query) => {
  const where = {
    ...visible(),
    ...(query.q && { fullName: { contains: query.q } }),
    ...(query.subjectId && {
      coachSubjects: { some: { subjectId: query.subjectId, subject: { isActive: true } } },
    }),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, fullName: true, ...include },
      ...toPrismaPage(query),
      orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
    }),
    prisma.user.count({ where }),
  ]);
  const ids = users.map((u) => u.id);
  const [ratings, classes] = await Promise.all([
    prisma.courseRating.groupBy({
      by: ['coachId'],
      where: { coachId: { in: ids } },
      _avg: { coachStars: true },
      _count: true,
    }),
    prisma.gymClass.groupBy({
      by: ['coachId'],
      where: { coachId: { in: ids }, status: Enums.ClassStatus.OPEN },
      _count: true,
    }),
  ]);
  return {
    items: users.map((u) => ({
      ...publicView(u),
      averageRating: ratings.find((i) => i.coachId === u.id)?._avg.coachStars ?? null,
      ratingCount: ratings.find((i) => i.coachId === u.id)?._count ?? 0,
      openClassCount: classes.find((i) => i.coachId === u.id)?._count ?? 0,
    })),
    meta: buildPageMeta({ ...query, total }),
  };
};
/** Chỉ tên viết tắt và nhận xét đã kiểm duyệt, kể cả người xem là quản lý. */
export const coachDetail = async (id) => {
  const account = await loadPublicCoach(id);
  const [classes, ratings] = await Promise.all([
    prisma.gymClass.findMany({
      where: { coachId: id, status: Enums.ClassStatus.OPEN },
      select: {
        id: true,
        name: true,
        price: true,
        startsOn: true,
        endsOn: true,
        subject: { select: { name: true } },
      },
      orderBy: { startsOn: 'asc' },
    }),
    listRatings(id, { page: 1, pageSize: PROFILE_LIMITS.RATING_LIMIT }, { permissions: new Set() }),
  ]);
  return {
    ...publicView(account),
    classes,
    ratings: ratings.items,
    averageRating: ratings.averages.coachStars,
    ratingCount: ratings.meta.total,
  };
};

/** Bộ lọc có cả chuyên môn của HLV chưa có lớp, không cần quyền quản trị danh mục. */
export const listCoachSubjects = async () => {
  const rows = await prisma.coachSubject.findMany({
    where: { coach: visible(), subject: { isActive: true } },
    select: { subject: { select: { id: true, name: true } } },
    distinct: ['subjectId'],
  });
  return rows.map((r) => r.subject).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
};
