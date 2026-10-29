import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { seedBase } from '../index.js';
import { seedSprint4Catalog } from './catalog.demo.js';
import { seedSprint4Courses } from './courses.demo.js';
import { seedSprint4Revenue } from './revenue.demo.js';

/** Seed bổ sung có prefix riêng, không reset, không gửi email thật. */
export const seedSprint4 = async () => {
  if (env.NODE_ENV === 'production') throw new Error('Không seed demo vào production');
  await seedBase({ mock: false });
  const catalog = await seedSprint4Catalog();
  const classes = await seedSprint4Courses(catalog);
  await seedSprint4Revenue(catalog, classes);
  logger.info({ classes: classes.map((c) => c.name), accounts: ['s4.coach@scms.test', 's4.member1@scms.test', 's4.member2@scms.test', 's4.member3@scms.test'] }, 'Seed Sprint 4 hoàn tất; mật khẩu lấy từ SEED_MOCK_PASSWORD');
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedSprint4().catch((err) => { logger.error({ err }, 'Seed Sprint 4 lỗi'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
