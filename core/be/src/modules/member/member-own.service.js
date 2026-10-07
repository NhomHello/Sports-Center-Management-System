import { PERMISSIONS } from '@scms/shared';
import { ensureUniqueContacts } from '../../common/utils/account-contacts.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import * as permissionService from '../permission/permission.service.js';
import { trySendVerificationEmail } from '../auth/email-verification.service.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';

/** Hồ sơ luôn lấy id từ token; membership chỉ hiện khi có quyền đọc tương ứng. */
export const getOwn = async (actor) => {
  const granted = await permissionService.getCodesByRoleId(actor.roleId);
  const membershipAccess =
    granted.has(PERMISSIONS.MEMBERSHIP_READ_OWN) || granted.has(PERMISSIONS.MEMBERSHIP_READ_ALL);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    include: {
      ...USER_WITH_ROLE,
      ...(membershipAccess && {
        memberships: { include: { plan: true }, orderBy: { endDate: 'desc' } },
      }),
    },
  });
  const { memberships: storedMemberships = [], ...profile } = user;
  const memberships = storedMemberships.map((item) => ({
    ...item,
    status: item.endDate <= new Date() ? Enums.MembershipStatus.EXPIRED : item.status,
  }));
  return {
    ...toPublicUser(profile),
    membershipAccess,
    memberships,
    currentMembership:
      memberships.find(
        (item) => item.status === Enums.MembershipStatus.ACTIVE && item.endDate > new Date(),
      ) ?? null,
  };
};

/** Chỉ sửa hồ sơ chính chủ và audit giá trị cũ/mới trong cùng transaction. */
export const updateOwn = async (actor, fields) => {
  let emailChangedUser = null;
  await prisma.$transaction(async (tx) => {
    await ensureUniqueContacts(fields, actor.id, tx);
    const before = await tx.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { fullName: true, email: true, phone: true },
    });
    const emailChanged = fields.email !== undefined && fields.email !== before.email;
    const after = await tx.user.update({
      where: { id: actor.id },
      // Đổi email => phải xác minh lại địa chỉ mới.
      data: { ...fields, ...(emailChanged && { emailVerifiedAt: null }) },
      select: { id: true, fullName: true, email: true, phone: true, status: true },
    });
    if (emailChanged) emailChangedUser = { ...after, emailVerifiedAt: null };
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.USER,
        entityId: String(actor.id),
        meta: {
          before,
          after: { fullName: after.fullName, email: after.email, phone: after.phone },
        },
      },
    });
  });
  if (emailChangedUser) void trySendVerificationEmail(emailChangedUser);
  return getOwn(actor);
};
