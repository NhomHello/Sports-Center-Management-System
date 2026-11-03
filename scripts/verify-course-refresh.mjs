import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import mariadb from 'mariadb';

process.loadEnvFile('core/be/.env');
assert.notEqual(
  process.env.NODE_ENV,
  'production',
  'Không chạy kiểm thử reset trên server production',
);
const url = new URL(process.env.DATABASE_URL);
const name = `scms_course_refresh_test_${Date.now()}`;
assert.match(name, /^scms_course_refresh_test_[0-9]+$/u);
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  allowPublicKeyRetrieval: true,
});
let created = false;
try {
  await connection.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  created = true;
  const target = new URL(url);
  target.pathname = `/${name}`;
  const childEnv = {
    ...process.env,
    DATABASE_URL: target.href,
    NODE_ENV: 'test',
    SETTING_CACHE_TTL_SECONDS: '0',
  };
  execFileSync(
    process.execPath,
    [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    {
      cwd: resolve('core/be'),
      env: childEnv,
      stdio: 'inherit',
    },
  );
  execFileSync(process.execPath, [resolve('core/be/prisma/seed/course-only/verify-fixture.js')], {
    env: childEnv,
    stdio: 'inherit',
  });
} finally {
  if (created) await connection.query(`DROP DATABASE \`${name}\``);
  await connection.end();
}
