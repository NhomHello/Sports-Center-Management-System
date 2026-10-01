import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { toPublicUser } from '../user/user.mapper.js';

const buildProfileInclude = () => ({
  role: { select: { id: true, name: true } },
  memberships: {
    where: { status: Enums.MembershipStatus.ACTIVE, endDate: { gt: new Date() } },
    include: { plan: true },
    orderBy: { endDate: 'desc' },
    take: 1,
  },
});

const toProfile = ({ memberships, ...user }) => ({
  ...toPublicUser(user),
  currentMembership: memberships[0] ?? null,
});

const contactFields = ({ fullName, email, phone }) => ({ fullName, email, phone });

/** Lấy đúng hồ sơ của tài khoản đang đăng nhập cùng membership hiện tại. */
export const getOwn = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: buildProfileInclude(),
  });
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
  return toProfile(user);
};

/** Chỉ cập nhật các trường hồ sơ cho phép và lưu giá trị trước/sau vào audit. */
export const updateOwn = async (userId, data) => {
  const before = await prisma.user.findUnique({
    where: { id: userId },
    include: buildProfileInclude(),
  });
  if (!before) throw ApiError.notFound('Không tìm thấy tài khoản');
  const after = await prisma.user.update({
    where: { id: userId },
    data,
    include: buildProfileInclude(),
  });
  await recordAudit({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.USER,
    entityId: userId,
    meta: { before: contactFields(before), after: contactFields(after) },
  });
  return toProfile(after);
};
