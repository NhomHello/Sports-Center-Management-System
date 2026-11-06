import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import mariadb from 'mariadb';

process.loadEnvFile('core/be/.env');
const root = process.cwd();
const url = new URL(process.env.DATABASE_URL);
const name = `scms_lecturer_test_${Date.now()}`;
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  allowPublicKeyRetrieval: true,
});
assert.match(name, /^scms_lecturer_test_\d+$/);
const target = new URL(url);
target.pathname = `/${name}`;
const env = {
  ...process.env,
  DATABASE_URL: target.href,
  SEED_MOCK_DATA: 'true',
  NODE_ENV: 'test',
};
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, env, stdio: 'inherit' });
try {
  await connection.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log('Testing lecturer changes on an isolated database; application data is preserved.');
  run(
    process.execPath,
    [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    path.join(root, 'core/be'),
  );
  run(process.execPath, ['prisma/seed/index.js'], path.join(root, 'core/be'));
  run('npm', ['test', ...process.argv.slice(2)]);
} finally {
  await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await connection.end();
}
