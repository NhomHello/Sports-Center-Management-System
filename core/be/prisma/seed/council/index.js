import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
import { prisma } from '../../../src/config/db.js';
import { logger } from '../../../src/config/logger.js';
import { councilContext, materializeCouncil } from './service.js';

/** Default preview maps the actual system date; --apply adds one namespaced rehearsal dataset. */
export const runCouncilCommand = async (args) => {
  if (
    args.some((arg) => !['--apply', '--dry-run'].includes(arg)) ||
    new Set(args).size !== args.length ||
    args.length > 1
  )
    throw new Error('Dùng npm run demo:prepare [-- --apply]; ngày lấy trực tiếp từ đồng hồ máy');
  const context = await councilContext();
  if (!args.includes('--apply'))
    return { dryRun: true, calendar: context.calendar, noticeHours: context.noticeHours };
  const result = await materializeCouncil(context);
  const directory = fileURLToPath(new URL('../../../../../docs/bao-cao/', import.meta.url));
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'demo-data.json'), `${JSON.stringify(result, null, 2)}\n`);
  return {
    dryRun: false,
    tag: result.tag,
    localDate: result.localDate,
    courses: Object.keys(result.courses).length,
    manifest: 'docs/bao-cao/demo-data.json',
  };
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  runCouncilCommand(process.argv.slice(2))
    .then((result) => logger.info(result, 'Dữ liệu hội đồng theo ngày chạy'))
    .catch((error) => {
      logger.error({ error: error.message }, 'Chuẩn bị dữ liệu không thành công');
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
