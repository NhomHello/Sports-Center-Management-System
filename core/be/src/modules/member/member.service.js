import { PERMISSIONS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { ensureUniqueContacts } from '../../common/utils/account-contacts.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';
import * as permissionService from '../permission/permission.service.js';

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

/** BR-0.2: chỉ sửa thông tin liên hệ; audit giá trị cũ/mới cùng transaction. */
export const updateOwn = async (actor, fields) => {
  await prisma.$transaction(async (tx) => {
    await ensureUniqueContacts(fields, actor.id, tx);
    const before = await tx.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { fullName: true, email: true, phone: true },
    });
    const after = await tx.user.update({
      where: { id: actor.id },
      data: fields,
      select: { fullName: true, email: true, phone: true },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.USER,
        entityId: String(actor.id),
        meta: { before, after },
      },
    });
  });
  return getOwn(actor);
};

/** Danh sách định danh hội viên dùng để chọn người nhận hóa đơn tại quầy. */
export const list = async (query) => {
  const where = {
    role: { isDefault: true },
    ...(query.search && {
      OR: [
        { fullName: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, phone: true, status: true },
      orderBy: { id: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.user.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};
