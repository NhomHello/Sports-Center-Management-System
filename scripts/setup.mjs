#!/usr/bin/env node
/**
 * CAI DAT LAN DAU:  npm run setup
 * Lam moi thu tru chay server: env, dependencies, docker MySQL, migrate, seed, git hooks.
 * Sau do chay: npm run dev
 */
import {
  BE_DIR,
  checkNodeVersion,
  dockerComposeUp,
  ensureEnvFile,
  FE_DIR,
  log,
  npm,
  ok,
  prepareDatabase,
  ROOT,
  waitForMysql,
} from './lib.mjs';

checkNodeVersion();
ensureEnvFile(ROOT);
ensureEnvFile(BE_DIR);
ensureEnvFile(FE_DIR);

log('Cai dependencies cho ca workspace...');
npm(['install']);

dockerComposeUp();
await waitForMysql();
prepareDatabase({ seed: true });

ok('Setup xong!');
console.log(`
  Chay du an:      npm run dev
  Frontend:        http://localhost:5173
  Backend health:  http://localhost:3000/api/v1/health
  Prisma Studio:   npm run db:studio

  Tai khoan admin:  xem SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD trong core/be/.env
  Tai khoan mau:    prisma/seed/mock/users.mock.js (mat khau: SEED_MOCK_PASSWORD)
  Tai lieu:         docs/README.md
`);
