import { spawn } from 'node:child_process';
process.loadEnvFile('core/be/.env');
const database = process.env.UI_TEST_DATABASE;
if (!/^scms_ui_[a-z0-9_]+$/.test(database ?? '')) {
  throw new Error('Set UI_TEST_DATABASE to a separate scms_ui_* database prepared with db:demo.');
}
const connection = new URL(process.env.DATABASE_URL);
if (connection.pathname === `/${database}`)
  throw new Error('Use a separate database from the configured application database.');
connection.pathname = `/${database}`;
const child = spawn(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'tests/e2e/ui-refinement.config.mjs',
    ...process.argv.slice(2),
  ],
  {
    env: {
      ...process.env,
      DATABASE_URL: connection.href,
      E2E_API_PORT: process.env.E2E_API_PORT || '3122',
      E2E_FE_PORT: process.env.E2E_FE_PORT || '5182',
    },
    windowsHide: true,
    stdio: 'inherit',
  },
);
child.on('exit', (code) => process.exit(code ?? 1));
