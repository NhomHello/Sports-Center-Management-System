// Chỉ được gọi bởi scripts/verify-course-refresh.mjs với database tạm có tên được kiểm soát.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { TIME } from '../../../src/constants/index.js';
import { seedBase } from '../index.js';
import { refreshCourses, previewRefresh } from './refresh-service.js';
import { runRefreshCommand } from './refresh.js';

const target = new URL(env.DATABASE_URL).pathname.slice(1);
assert.match(target, /^scms_course_refresh_test_[0-9]+$/u, 'Test này chỉ chạy trên DB tạm riêng');
assert.equal(env.NODE_ENV, 'test');
const counts = () =>
  Promise.all([
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.membership.count(),
    prisma.training_plans.count(),
  ]);
try {
  await seedBase({ mock: false });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  const memberRole = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const oldUser = await prisma.user.create({
    data: {
      fullName: 'OLD USER WITHOUT EMAIL',
      passwordHash: admin.passwordHash,
      roleId: memberRole.id,
    },
  });
  const plan = await prisma.membershipPlan.create({
    data: { code: 'OLD_PLAN', name: 'Gói cũ sẽ xoá', price: 300000, durationDays: 30 },
  });
  const invoice = await prisma.invoice.create({
    data: {
      code: 'OLD_INVOICE',
      userId: oldUser.id,
      planId: plan.id,
      amount: plan.price,
      expiresAt: new Date(),
    },
  });
  const membership = await prisma.membership.create({
    data: {
      userId: oldUser.id,
      planId: plan.id,
      invoiceId: invoice.id,
      activeUserId: oldUser.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + TIME.MS_PER_DAY),
    },
  });
  await prisma.invoice.update({ where: { id: invoice.id }, data: { membershipId: membership.id } });
  const legacy = await prisma.training_plans.create({
    data: { member_id: oldUser.id, coach_id: admin.id, title: 'Legacy FK', updated_at: new Date() },
  });
  const exercise = await prisma.training_exercises.create({
    data: {
      plan_id: legacy.id,
      name: 'Legacy exercise',
      sets: 1,
      repetitions: '1',
      order: 1,
      updated_at: new Date(),
    },
  });
  await prisma.exercise_completions.create({
    data: { exercise_id: exercise.id, member_id: oldUser.id },
  });
  await prisma.training_results.create({
    data: {
      member_id: oldUser.id,
      coach_id: admin.id,
      plan_id: legacy.id,
      comment: 'Legacy result',
      updated_at: new Date(),
    },
  });
  const configAudit = await prisma.auditLog.create({
    data: {
      entity: 'Role',
      action: 'UPDATE',
      userId: oldUser.id,
      meta: { seedBackfill: ['example.old.permission'] },
    },
  });
  await prisma.systemSetting.update({
    where: { key: 'PAYMENT_ACCOUNT_NUMBER' },
    data: { value: '000000001234' },
  });
  const rolePermissions = await prisma.rolePermission.count();
  const before = await counts();
  const preview = await previewRefresh();
  assert.equal(preview.dryRun, true);
  assert.deepEqual(await counts(), before);
  assert.ok(preview.wouldDelete.memberships > 0);
  assert.ok(preview.wouldDelete.training_plans > 0);
  await assert.rejects(runRefreshCommand(['--invalid']), /Chỉ hỗ trợ/u);
  await assert.rejects(
    refreshCourses({
      seedDataset: async (db) => {
        await db.user.create({
          data: {
            email: 'partial@scms.test',
            fullName: 'PARTIAL SEED',
            passwordHash: admin.passwordHash,
            roleId: memberRole.id,
          },
        });
        throw new Error('FORCED_SEED_ROLLBACK');
      },
    }),
    /FORCED_SEED_ROLLBACK/u,
  );
  assert.deepEqual(await counts(), before);
  assert.equal(
    (await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).membershipId,
    membership.id,
  );
  assert.equal(
    (await prisma.membership.findUniqueOrThrow({ where: { id: membership.id } })).invoiceId,
    invoice.id,
  );
  assert.equal(await prisma.user.count({ where: { email: 'partial@scms.test' } }), 0);
  const result = await runRefreshCommand(['--yes']);
  assert.equal(result.dryRun, false);
  assert.deepEqual(result.created, {
    courses: 16,
    invoices: 44,
    payments: 43,
    enrollments: 44,
    pending: 1,
    waiting: 1,
    feedback: 154,
    summaries: 14,
    packages: 0,
    memberships: 0,
  });
  assert.equal(await prisma.user.count({ where: { id: oldUser.id } }), 0);
  assert.equal(await prisma.training_plans.count(), 0);
  assert.equal(await prisma.exercise_completions.count(), 0);
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).passwordHash ===
      admin.passwordHash,
    true,
    'Admin credential changed',
  );
  assert.equal(
    (await prisma.systemSetting.findUniqueOrThrow({ where: { key: 'PAYMENT_ACCOUNT_NUMBER' } }))
      .value,
    '000000001234',
  );
  assert.equal(await prisma.rolePermission.count(), rolePermissions);
  assert.ok(await prisma.auditLog.findUnique({ where: { id: configAudit.id } }));
  const firstMember = await prisma.user.findFirstOrThrow({
    where: { role: { isDefault: true } },
    orderBy: { id: 'asc' },
  });
  assert.ok(firstMember.id > oldUser.id, 'Không tái sử dụng ID của JWT cũ');
  const after = await counts();
  await previewRefresh();
  assert.deepEqual(await counts(), after);
  const denied = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./refresh.js', import.meta.url)), '--yes'],
    {
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8',
    },
  );
  assert.notEqual(denied.status, 0);
  assert.match(denied.stdout + denied.stderr, /production/u);
  assert.deepEqual(await counts(), after);
  const repeated = await refreshCourses();
  assert.deepEqual(repeated.created, result.created);
  process.stdout.write(
    JSON.stringify({
      passed: true,
      checks: [
        'dry-run does not write',
        'legacy/cyclic FK cleanup',
        'atomic rollback',
        'admin/config preserved',
        'consistent mapped data',
        'no ID reuse',
        'production refused',
        'repeat refresh',
      ],
      created: result.created,
    }) + '\n',
  );
} finally {
  await prisma.$disconnect();
}
