/**
 * Ham dung chung cho scripts/dev.mjs va scripts/setup.mjs.
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BE_DIR = path.join(ROOT, 'core', 'be');
export const FE_DIR = path.join(ROOT, 'core', 'fe');
export const IS_WINDOWS = process.platform === 'win32';
export const MYSQL_CONTAINER = 'scms-mysql';
const MYSQL_WAIT_MAX_TRIES = 60;
const MYSQL_WAIT_INTERVAL_MS = 2000;
const MIN_NODE_MAJOR = 22;

const COLORS = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

export const log = (msg) => console.log(`${COLORS.cyan}[scms]${COLORS.reset} ${msg}`);
export const ok = (msg) => console.log(`${COLORS.green}[scms] ✔${COLORS.reset} ${msg}`);
export const warn = (msg) => console.log(`${COLORS.yellow}[scms] !${COLORS.reset} ${msg}`);
export const fail = (msg) => {
  console.error(`${COLORS.red}[scms] ✖ ${msg}${COLORS.reset}`);
  process.exit(1);
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Chay lenh dong bo, in truc tiep ra terminal, dung script neu loi. */
export const run = (cmd, args, { cwd = ROOT, shell = IS_WINDOWS } = {}) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell });
  if (result.status !== 0) fail(`Lenh that bai: ${cmd} ${args.join(' ')}`);
};

/** npm phai chay qua shell tren Windows (npm.cmd) */
export const npm = (args, cwd = ROOT) => run('npm', args, { cwd, shell: true });

export const checkNodeVersion = () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < MIN_NODE_MAJOR)
    fail(`Can Node >= ${MIN_NODE_MAJOR}, dang dung ${process.versions.node}`);
};

/** Tao .env tu .env.example neu chua co */
export const ensureEnvFile = (dir) => {
  const target = path.join(dir, '.env');
  if (existsSync(target)) return;
  copyFileSync(path.join(dir, '.env.example'), target);
  warn(`Da tao ${path.relative(ROOT, target)} tu .env.example - kiem tra lai gia tri neu can`);
};

export const ensureDependencies = () => {
  if (existsSync(path.join(ROOT, 'node_modules', '.package-lock.json'))) return;
  log('Chua cai dependencies, chay npm install...');
  npm(['install']);
};

export const isDockerRunning = () =>
  spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0;

export const dockerComposeUp = () => {
  if (!isDockerRunning())
    fail('Docker chua chay. Mo Docker Desktop roi chay lai (hoac dung --no-docker).');
  run('docker', ['compose', 'up', '-d', 'mysql'], { shell: false });
};

export const waitForMysql = async () => {
  process.stdout.write(`${COLORS.cyan}[scms]${COLORS.reset} Cho MySQL san sang`);
  for (let i = 0; i < MYSQL_WAIT_MAX_TRIES; i += 1) {
    const result = spawnSync(
      'docker',
      ['inspect', '--format', '{{.State.Health.Status}}', MYSQL_CONTAINER],
      { encoding: 'utf8' },
    );
    if (result.stdout?.trim() === 'healthy') {
      console.log('');
      ok('MySQL san sang');
      return;
    }
    process.stdout.write('.');
    await sleep(MYSQL_WAIT_INTERVAL_MS);
  }
  console.log('');
  fail('MySQL khong len sau 2 phut. Xem: docker compose logs mysql');
};

/** generate client + apply migration da commit + seed (idempotent) */
export const prepareDatabase = ({ seed = true } = {}) => {
  log('Prisma generate...');
  npm(['run', 'db:generate', '-w', '@scms/be']);
  log('Apply migrations...');
  npm(['run', 'db:deploy', '-w', '@scms/be']);
  if (seed) {
    log('Seed du lieu (permission, role, admin, settings, mock)...');
    npm(['run', 'db:seed', '-w', '@scms/be']);
  }
};

/** Chay process con, gan tien to mau cho tung dong output */
export const spawnPrefixed = (name, color, cmd, args, cwd) => {
  const child = spawn(cmd, args, { cwd, shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
  const prefix = `${color}[${name}]${COLORS.reset} `;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      lines.forEach((line) => out.write(prefix + line + '\n'));
    });
    stream.on('end', () => buffer && out.write(prefix + buffer + '\n'));
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
};

export const killTree = (child) => {
  if (child.exitCode !== null) return;
  if (IS_WINDOWS)
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
};

export { COLORS };
