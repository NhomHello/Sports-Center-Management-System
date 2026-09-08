#!/usr/bin/env node
/**
 * MOT LENH CHAY TAT CA:  npm run dev
 *   1. Tao .env neu thieu, cai dependencies neu thieu
 *   2. Bat MySQL bang Docker va cho healthy
 *   3. prisma generate -> migrate deploy -> seed (idempotent)
 *   4. Chay BE (node --watch) + FE (vite) song song, Ctrl+C tat ca hai
 *
 * Tuy chon:  --no-docker  (tu chay MySQL rieng)   --no-seed   --be-only   --fe-only
 */
import {
  BE_DIR,
  checkNodeVersion,
  COLORS,
  dockerComposeUp,
  ensureDependencies,
  ensureEnvFile,
  FE_DIR,
  killTree,
  log,
  ok,
  prepareDatabase,
  ROOT,
  spawnPrefixed,
  waitForMysql,
} from './lib.mjs';

const args = new Set(process.argv.slice(2));
const useDocker = !args.has('--no-docker');
const runBe = !args.has('--fe-only');
const runFe = !args.has('--be-only');

checkNodeVersion();
ensureEnvFile(BE_DIR);
ensureEnvFile(FE_DIR);
ensureEnvFile(ROOT);
ensureDependencies();

if (runBe) {
  if (useDocker) {
    dockerComposeUp();
    await waitForMysql();
  }
  prepareDatabase({ seed: !args.has('--no-seed') });
}

const children = [];
if (runBe)
  children.push(spawnPrefixed('be', COLORS.green, 'npm', ['run', 'dev', '-w', '@scms/be'], ROOT));
if (runFe)
  children.push(spawnPrefixed('fe', COLORS.cyan, 'npm', ['run', 'dev', '-w', '@scms/fe'], ROOT));

ok('Dang chay. Nhan Ctrl+C de dung tat ca.');
log('Tai khoan mau xem o core/be/.env (SEED_ADMIN_*) va prisma/seed/mock/users.mock.js');

const shutdown = () => {
  log('Dang tat...');
  children.forEach(killTree);
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
children.forEach((child) => child.on('exit', (code) => code && shutdown()));
