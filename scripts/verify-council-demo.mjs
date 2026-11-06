import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import mariadb from 'mariadb';
import { checkCouncilDemo } from './council-demo-checks.mjs';

process.loadEnvFile('core/be/.env');
const root = process.cwd();
const url = new URL(process.env.DATABASE_URL);
const name = `scms_council_test_${Date.now()}`;
assert.match(name, /^scms_council_test_\d+$/);
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  allowPublicKeyRetrieval: true,
});
let server;
let prisma;
try {
  const bank = await connection.query(
    'SELECT `key`,value FROM system_settings WHERE `key` IN (?,?,?)',
    ['PAYMENT_BANK_CODE', 'PAYMENT_ACCOUNT_NUMBER', 'PAYMENT_ACCOUNT_NAME'],
  );
  await connection.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  url.pathname = `/${name}`;
  Object.assign(process.env, { DATABASE_URL: url.href, NODE_ENV: 'test', SEED_MOCK_DATA: 'true' });
  const run = (file, args) =>
    execFileSync(process.execPath, [file, ...args], {
      cwd: path.join(root, 'core/be'),
      env: process.env,
      stdio: 'inherit',
    });
  run(path.join(root, 'node_modules/prisma/build/index.js'), ['migrate', 'deploy']);
  run('prisma/seed/index.js', []);
  ({ prisma } = await import('../core/be/src/config/db.js'));
  for (const row of bank)
    await prisma.systemSetting.update({ where: { key: row.key }, data: { value: row.value } });
  const { councilContext, materializeCouncil } =
    await import('../core/be/prisma/seed/council/service.js');
  const manifest = await materializeCouncil(await councilContext());
  const { app } = await import('../core/be/src/app.js');
  const { env } = await import('../core/be/src/config/env.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}${env.API_PREFIX}`;
  const request = async (method, endpoint, body, token, headers = {}) => {
    const response = await fetch(origin + endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    const mime = response.headers.get('content-type') || '';
    return {
      status: response.status,
      mime,
      body: mime.includes('json')
        ? await response.json()
        : { bytes: (await response.arrayBuffer()).byteLength },
    };
  };
  const result = await checkCouncilDemo({ manifest, env, prisma, request });
  const replay = await promisify(execFile)(
    process.execPath,
    ['scripts/replay-demo-webhook.mjs', result.invoiceCode],
    { cwd: root, env: { ...process.env, PORT: String(server.address().port) } },
  );
  const replayResult = JSON.parse(replay.stdout.trim());
  assert.equal(replayResult.status, 'DUPLICATE');
  const evidence = {
    replayUtility: replayResult,
    ...result,
    executedAt: new Date().toISOString(),
    database:
      'Isolated temporary database; removed after verification; active council demo dataset preserved',
  };
  writeFileSync(
    path.join(root, 'docs/kiem-thu/council-demo-preflight.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(JSON.stringify(evidence));
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (prisma) await prisma.$disconnect();
  await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await connection.end();
}
