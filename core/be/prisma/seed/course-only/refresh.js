import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../../src/config/db.js';
import { logger } from '../../../src/config/logger.js';
import { assertRefreshAllowed, previewRefresh, refreshCourses } from './refresh-service.js';

/** CLI mặc định preview; chỉ --yes mới xóa dữ liệu. Không tự áp dụng migration hoặc reset schema. */
export const runRefreshCommand = async (args) => {
  assertRefreshAllowed();
  const allowed = new Set(['--yes', '--dry-run', '--help']);
  if (args.some((arg) => !allowed.has(arg)))
    throw new Error('Chỉ hỗ trợ --yes, --dry-run hoặc --help');
  if (args.includes('--help'))
    return {
      dryRun: true,
      usage: 'npm run db:refresh:courses -- --yes',
      default: 'preview; không ghi dữ liệu',
    };
  if (args.includes('--yes') && args.includes('--dry-run'))
    throw new Error('Không dùng --yes cùng --dry-run');
  return args.includes('--yes') ? refreshCourses() : previewRefresh();
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runRefreshCommand(process.argv.slice(2))
    .then((result) =>
      logger.info(
        result,
        result.dryRun ? 'Kế hoạch thay dữ liệu (chưa xóa)' : 'Dữ liệu khóa học đã được map lại',
      ),
    )
    .catch((err) => {
      logger.error({ err }, 'Không hoàn tất thay dữ liệu; transaction lỗi được rollback');
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
