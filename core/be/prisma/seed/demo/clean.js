/** Dọn dữ liệu nghiệp vụ/legacy; giữ cấu hình, phân quyền, admin và số thứ tự ID. */
import { prisma } from '../../../src/config/db.js';
import { logger } from '../../../src/config/logger.js';
import { lockSchedule } from '../../../src/common/utils/schedule-transaction.js';
import { buildCleanupPlan, clearBusinessData } from '../course-only/cleanup-plan.js';
import { assertRefreshAllowed, loadPreservedAdmin } from '../course-only/refresh-service.js';
import { DATASET } from '../course-only/dataset-config.js';

/** Không tắt FOREIGN_KEY_CHECKS; gỡ liên kết nullable và xoá con trước cha trong transaction. */
export const cleanDatabase = async () => {
  assertRefreshAllowed();
  const admin = await loadPreservedAdmin();
  const plan = await buildCleanupPlan();
  return prisma.$transaction(
    async (tx) => {
      await lockSchedule(tx);
      return clearBusinessData(tx, plan, admin.id);
    },
    { timeout: DATASET.TX_TIMEOUT_MS, maxWait: DATASET.MAX_WAIT_MS },
  );
};
if (process.argv[1]?.endsWith('clean.js')) {
  Promise.resolve()
    .then(() => {
      assertRefreshAllowed();
      if (!process.argv.includes('--yes'))
        throw new Error('Lệnh này xóa dữ liệu nghiệp vụ. Thêm --yes để thực hiện');
      return cleanDatabase();
    })
    .then((deleted) => logger.info({ deleted }, 'Đã dọn dữ liệu nghiệp vụ'))
    .catch((err) => {
      logger.error({ err }, 'Dọn dữ liệu không thành công');
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
