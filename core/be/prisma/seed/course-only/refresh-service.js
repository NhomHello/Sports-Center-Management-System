import { SETTING_KEYS as K } from '@scms/shared';
import { prisma, Enums } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { AUDIT_ACTIONS } from '../../../src/constants/index.js';
import { lockSchedule } from '../../../src/common/utils/schedule-transaction.js';
import { getValue } from '../../../src/modules/setting/setting.service.js';
import { loadInvoicePolicy } from '../../../src/modules/payment/invoice-create.service.js';
import { seedBase } from '../index.js';
import { buildCleanupPlan, cleanupCounts, clearBusinessData } from './cleanup-plan.js';
import { seedMappedCourseData } from './mapped-dataset.js';
import { validateMappedData } from './validate-dataset.js';
import { DATASET, courseTemplates } from './dataset-config.js';

/** Dữ liệu mẫu không được ghi lên production; dùng chung cho preview, clean và refresh. */
export const assertRefreshAllowed = () => {
  if (env.NODE_ENV === 'production')
    throw new Error('Từ chối xóa/tạo dữ liệu mẫu khi NODE_ENV=production');
  if (!env.SEED_ADMIN_EMAIL)
    throw new Error('Cần cấu hình SEED_ADMIN_EMAIL để xác định tài khoản được giữ');
};
/** Giữ admin theo ID, kể cả các user khác có email NULL cũng được dọn đúng. */
export const loadPreservedAdmin = async () => {
  assertRefreshAllowed();
  const admin = await prisma.user.findUnique({
    where: { email: env.SEED_ADMIN_EMAIL },
    select: { id: true },
  });
  if (!admin) throw new Error('Không tìm thấy admin được giữ. Hãy chạy npm run db:seed trước');
  return admin;
};

/** Mặc định CLI chỉ đọc và cho biết số hàng sẽ thay, không gọi seedBase hoặc ghi dữ liệu. */
export const previewRefresh = async () => {
  const admin = await loadPreservedAdmin();
  const plan = await buildCleanupPlan();
  return {
    dryRun: true,
    database: new URL(env.DATABASE_URL).pathname.slice(1),
    preserve: plan.preserved,
    adminUserId: admin.id,
    wouldDelete: await cleanupCounts(prisma, plan, admin.id),
    newCourses: courseTemplates(new Date()).length,
    note: 'Chạy lại với --yes để xóa và tạo lại dữ liệu nghiệp vụ.',
  };
};

/** Clear + map dữ liệu mới + kiểm tra FK/nghiệp vụ là một transaction, lỗi ở đâu rollback ở đó. */
export const refreshCourses = async ({
  now = new Date(),
  seedDataset = seedMappedCourseData,
} = {}) => {
  assertRefreshAllowed();
  await seedBase({ mock: false });
  const admin = await loadPreservedAdmin();
  const plan = await buildCleanupPlan();
  const [policy, deadlineDays, passPercent] = await Promise.all([
    loadInvoicePolicy(),
    getValue(K.COURSE_SUMMARY_DEADLINE_DAYS),
    getValue(K.COURSE_PASS_MIN_ATTENDANCE_PERCENT),
  ]);
  return prisma.$transaction(
    async (db) => {
      await lockSchedule(db);
      const deleted = await clearBusinessData(db, plan, admin.id);
      const created = await seedDataset(db, { now, admin, policy, deadlineDays, passPercent });
      const validated = await validateMappedData(db, created);
      await db.auditLog.create({
        data: {
          userId: admin.id,
          action: AUDIT_ACTIONS.UPDATE,
          entity: 'CourseDataRefresh',
          meta: { dataset: 'course-only', deleted, created: validated },
        },
      });
      return {
        dryRun: false,
        adminUserId: admin.id,
        deleted,
        created: validated,
        mapping: created,
      };
    },
    {
      isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted,
      timeout: DATASET.TX_TIMEOUT_MS,
      maxWait: DATASET.MAX_WAIT_MS,
    },
  );
};
