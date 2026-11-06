import { execFileSync } from 'node:child_process';

process.loadEnvFile('core/be/.env');
const args = process.argv.slice(2);
execFileSync(process.execPath, ['core/be/prisma/seed/council/index.js', ...args], {
  env: process.env,
  stdio: 'inherit',
});
if (args.includes('--apply')) {
  execFileSync(process.env.SWP_REPORT_PYTHON || 'python3', ['scripts/reporting/build.py'], {
    env: process.env,
    stdio: 'inherit',
  });
}
