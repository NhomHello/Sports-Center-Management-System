import { StatusCodes } from 'http-status-codes';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../src/config/db.js';
import { api, apiPath, bearer, loginAs } from './api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './sprint2.js';
/** Fixture hồ sơ có lớp đăng ký, quyền theo role riêng, không sửa dữ liệu demo. */
export const createProfileFixture = async () => {
  const f = await createClassFixture();
  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        in: [P.COACH_PROFILE_READ, P.COACH_PROFILE_UPDATE_OWN, P.MEMBER_PROFILE_VIEW_ASSIGNED],
      },
    },
  });
  await prisma.rolePermission.createMany({
    skipDuplicates: true,
    data: permissions.map((p) => ({ roleId: f.coach.roleId, permissionId: p.id })),
  });
  f.coachToken = await loginAs(f.coach.email, f.password);
  f.coachOtherToken = await loginAs(f.coachOther.email, f.password);
  f.call = (method, path, body, token = f.memberToken) =>
    api[method](apiPath(path)).set(bearer(token)).send(body);
  const result = await f.call('post', '/classes', classPayload(f), f.adminToken);
  if (result.status !== StatusCodes.CREATED) throw new Error(JSON.stringify(result.body));
  f.item = result.body.data;
  const booking = await f.call('post', `/classes/${f.item.id}/enrollments/me`, {});
  if (booking.status !== StatusCodes.CREATED) throw new Error(JSON.stringify(booking.body));
  return f;
};
/** Dọn FK mới trước fixture lớp cũ. */
export const cleanupProfileFixture = async (f) => {
  if (!f) return;
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.courseRating.deleteMany({ where: { classId: f.item.id } });
  await prisma.auditLog.deleteMany({
    where: { userId: f.admin.id, entity: 'memberProfile', entityId: String(f.member.id) },
  });
  await cleanupClassFixture(f);
};
