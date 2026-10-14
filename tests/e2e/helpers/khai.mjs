import { PERMISSIONS } from '@scms/shared';
import { expect } from '@playwright/test';
import { prisma } from '../../../core/be/src/config/db.js';
import { api, apiPath, bearer } from '../../../core/be/tests/helpers/api.js';
import {
  createClassFixture,
  cleanupClassFixture,
  classPayload,
} from '../../../core/be/tests/helpers/sprint2.js';
import { loginKey } from '../../../core/be/src/modules/auth/login-lock.service.js';

export const call = (f, method, path, body, token = f.adminToken) =>
  api[method](apiPath(path)).set(bearer(token)).send(body);
export async function fixture({ freeze = false } = {}) {
  const f = await createClassFixture();
  if (freeze) {
    const base = await prisma.rolePermission.findMany({
      where: { roleId: f.member.roleId },
      select: { permissionId: true },
    });
    const freezePermission = await prisma.permission.findUniqueOrThrow({
      where: { code: PERMISSIONS.MEMBERSHIP_FREEZE_SELF },
    });
    const role = await prisma.role.create({
      data: {
        code: `${f.prefix}_UI`,
        name: `${f.prefix} UI`,
        permissions: {
          create: [...new Set([...base.map((p) => p.permissionId), freezePermission.id])].map(
            (permissionId) => ({ permissionId }),
          ),
        },
      },
    });
    f.roleIds.push(role.id);
    await prisma.user.update({ where: { id: f.member.id }, data: { roleId: role.id } });
  }
  const result = await call(f, 'post', '/classes', classPayload(f, { capacity: 1 }));
  expect(result.status).toBe(201);
  f.item = result.body.data;
  return f;
}
export async function cleanup(f) {
  if (!f) return;
  const classes = await prisma.gymClass.findMany({
    where: { subjectId: f.subject.id },
    select: { id: true },
  });
  const ids = classes.map((row) => row.id);
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.classWaitlist.deleteMany({ where: { classId: { in: ids } } });
  await prisma.roomMaintenance.deleteMany({
    where: { roomId: { in: [f.room.id, f.roomOther.id] } },
  });
  await prisma.membershipFreeze.deleteMany({
    where: { membership: { userId: { in: f.userIds } } },
  });
  await prisma.checkIn.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.loginThrottle.deleteMany({
    where: { key: { in: f.userIds.map((id) => loginKey({ id })) } },
  });
  await cleanupClassFixture(f);
}
export async function searchClass(page, f) {
  const input = page.getByPlaceholder('Tìm tên lớp');
  await input.fill(f.item.name);
  await input.press('Enter');
  return page.locator('.scms-class-card').filter({ hasText: f.item.name });
}
