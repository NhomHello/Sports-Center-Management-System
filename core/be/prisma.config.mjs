// Cau hinh Prisma 7. DATABASE_URL doc tu core/be/.env
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --env-file-if-exists=.env prisma/seed/index.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
