#!/usr/bin/env node
/**
 * MOT LENH CHAY TAT CA:  npm run dev
 *   1. Tao .env neu thieu, cai dependencies neu thieu
 *   2. Bat MySQL bang Docker va cho healthy
 *   3. prisma generate -> migrate deploy -> seed (idempotent)
 *   4. Chay BE (node --watch) + FE (vite) song song, Ctrl+C tat ca hai
 *
 * Tuy chon:  --no-docker  --no-seed  --be-only  --fe-only  --prepare-only
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
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
const shouldSeed = !args.has('--no-seed');

const readEnvValue = (file, key) => {
  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(`${key}=`));
  return line
    ?.slice(line.indexOf('=') + 1)
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2');
};

const printDemoAccounts = async () => {
  const envFile = path.join(BE_DIR, '.env');
  const adminEmail = readEnvValue(envFile, 'SEED_ADMIN_EMAIL');
  const adminPassword = readEnvValue(envFile, 'SEED_ADMIN_PASSWORD');
  const mockPassword = readEnvValue(envFile, 'SEED_MOCK_PASSWORD');
  const { SEED_MOCK_USERS } = await import('../core/be/prisma/seed/mock/users.mock.js');
  console.log('\n  Tai khoan demo da seed:');
  console.log(`  CENTER_MANAGER  ${adminEmail}  /  ${adminPassword}`);
  SEED_MOCK_USERS.forEach(({ roleCode, email }) =>
    console.log(`  ${roleCode.padEnd(15)} ${email}  /  ${mockPassword}`),
  );
  console.log('');
};

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
  if (shouldSeed) process.env.SEED_MOCK_DATA = 'true';
  prepareDatabase({ seed: shouldSeed });
  if (shouldSeed) await printDemoAccounts();
}

if (args.has('--prepare-only')) {
  ok('Da chuan bi xong database va tai khoan demo.');
  process.exit(0);
}

const children = [];
if (runBe)
  children.push(spawnPrefixed('be', COLORS.green, 'npm', ['run', 'dev', '-w', '@scms/be'], ROOT));
if (runFe)
  children.push(spawnPrefixed('fe', COLORS.cyan, 'npm', ['run', 'dev', '-w', '@scms/fe'], ROOT));

ok('Dang chay. Nhan Ctrl+C de dung tat ca.');
log('Frontend: http://localhost:5173 | Backend: http://localhost:3000/api/v1');

const shutdown = () => {
  log('Dang tat...');
  children.forEach(killTree);
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
children.forEach((child) => child.on('exit', (code) => code && shutdown()));
