import { PERMISSIONS } from '@scms/shared';
import { ensureUniqueContacts } from '../../common/utils/account-contacts.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import * as permissionService from '../permission/permission.service.js';
import { logger } from '../../config/logger.js';
import { getPendingEmail, requestEmailChange } from '../auth/email-verification.service.js';
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
    pendingEmail: await getPendingEmail(actor.id),
    membershipAccess,
    memberships,
    currentMembership:
      memberships.find(
        (item) => item.status === Enums.MembershipStatus.ACTIVE && item.endDate > new Date(),
      ) ?? null,
  };
};

/**
 * Chỉ sửa hồ sơ chính chủ và audit giá trị cũ/mới trong cùng transaction.
 * Email mới không được áp dụng ngay: phải bấm link gửi tới địa chỉ mới (tránh gõ sai làm mất
 * quyền đăng nhập). Điền lại email hiện tại sẽ huỷ yêu cầu đổi đang chờ.
 */
export const updateOwn = async (actor, { email, ...fields }) => {
  let emailChangeTo = null;
  await prisma.$transaction(async (tx) => {
    await ensureUniqueContacts({ ...fields, ...(email !== undefined && { email }) }, actor.id, tx);
    const before = await tx.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { fullName: true, email: true, phone: true },
    });
    const emailChanged = email !== undefined && email !== before.email;
    if (emailChanged) emailChangeTo = email;
    if (email !== undefined && !emailChanged) {
      await tx.emailVerificationToken.deleteMany({
        where: { userId: actor.id, purpose: Enums.EmailTokenPurpose.CHANGE_EMAIL, usedAt: null },
      });
    }
    const after = await tx.user.update({
      where: { id: actor.id },
      data: fields,
      select: { id: true, fullName: true, email: true, phone: true, status: true },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.USER,
        entityId: String(actor.id),
        meta: {
          before,
          after: { fullName: after.fullName, email: after.email, phone: after.phone },
          ...(emailChanged && { emailChangeRequested: email }),
        },
      },
    });
  });
  if (emailChangeTo) {
    try {
      await requestEmailChange({ id: actor.id, fullName: actor.fullName }, emailChangeTo);
    } catch (err) {
      logger.error({ err, userId: actor.id }, 'Gửi email xác nhận đổi email thất bại');
    }
  }
  return getOwn(actor);
};
