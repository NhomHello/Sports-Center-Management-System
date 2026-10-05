import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import mariadb from 'mariadb';

process.loadEnvFile('core/be/.env');
const root = process.cwd();
const be = path.join(root, 'core/be');
const url = new URL(process.env.DATABASE_URL);
const tag = String(Date.now());
const names = [`scms_sprint2_new_test_${tag}`, `scms_sprint2_upgrade_test_${tag}`];
const created = [];
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  multipleStatements: true,
  allowPublicKeyRetrieval: true,
  dateStrings: true,
});
const migrations = path.join(be, 'prisma/migrations');
const directories = readdirSync(migrations, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const current = '20261005100000_sprint2_class_booking';
const childEnv = (name) => {
  const target = new URL(url);
  target.pathname = `/${name}`;
  return { ...process.env, DATABASE_URL: target.href };
};
const runNode = (file, args, options = {}) =>
  execFileSync(process.execPath, [file, ...args], {
    stdio: 'inherit',
    ...options,
  });
const prismaCli = path.join(root, 'node_modules/prisma/build/index.js');
const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
async function createDatabase(name) {
  assert.match(name, /^scms_sprint2_(new|upgrade)_test_[0-9]+$/);
  await connection.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  created.push(name);
}
async function snapshot(tables) {
  return Object.fromEntries(
    await Promise.all(
      tables.map(async (table) => [
        table,
        JSON.stringify(
          (await connection.query(`SELECT * FROM \`${table}\``))
            .map((row) =>
              JSON.stringify(row, (_key, value) =>
                typeof value === 'bigint' ? String(value) : value,
              ),
            )
            .sort(),
          (_key, value) => (typeof value === 'bigint' ? String(value) : value),
        ),
      ]),
    ),
  );
}
try {
  await createDatabase(names[0]);
  process.stdout.write(
    'Verify clean Prisma deployment and run all workspace tests on an isolated database.\n',
  );
  const env = childEnv(names[0]);
  runNode(prismaCli, ['migrate', 'deploy'], { cwd: be, env });
  runNode(path.join(be, 'prisma/seed/index.js'), [], { cwd: be, env });
  runNode(npmCli, ['test'], { cwd: root, env });

  await createDatabase(names[1]);
  await connection.query(`USE \`${names[1]}\``);
  for (const directory of directories.filter((name) => name < current)) {
    await connection.query(readFileSync(path.join(migrations, directory, 'migration.sql'), 'utf8'));
  }
  await connection.query(
    readFileSync(path.join(root, 'tests/fixtures/sprint2-upgrade.sql'), 'utf8'),
  );
  const tables = (await connection.query('SHOW TABLES')).map((row) => Object.values(row)[0]);
  for (const table of tables) assert.match(table, /^[a-z_]+$/);
  const unchangedTables = tables.filter((table) => table !== 'class_sessions');
  const before = await snapshot(unchangedTables);
  const oldSessionColumns = (await connection.query('SHOW COLUMNS FROM class_sessions'))
    .map((column) => `\`${column.Field}\``)
    .join(',');
  const oldSessions = await connection.query(
    `SELECT ${oldSessionColumns} FROM class_sessions ORDER BY id`,
  );
  const oldLinks = await connection.query(
    'SELECT TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME',
    [names[1]],
  );
  await connection.query(readFileSync(path.join(migrations, current, 'migration.sql'), 'utf8'));
  assert.deepEqual(
    await snapshot(unchangedTables),
    before,
    'Historical rows must remain unchanged',
  );
  assert.deepEqual(
    await connection.query(`SELECT ${oldSessionColumns} FROM class_sessions ORDER BY id`),
    oldSessions,
    'Every existing session field must remain unchanged',
  );
  const newLinks = await connection.query(
    'SELECT TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,CONSTRAINT_NAME,COLUMN_NAME',
    [names[1]],
  );
  for (const oldLink of oldLinks)
    assert.ok(
      newLinks.some((newLink) => JSON.stringify(newLink) === JSON.stringify(oldLink)),
      'Every historical FK must remain',
    );
  const [session] = await connection.query(
    'SELECT status,room_name,coach_name FROM class_sessions WHERE id=1',
  );
  assert.equal(session.status, 'COMPLETED');
  assert.equal(session.room_name, 'Historical Room');
  assert.equal(session.coach_name, 'Historical Person');
  await assert.rejects(
    connection.query(
      'INSERT INTO class_enrollments (class_id,member_id,enrolled_by,updated_at) VALUES (99999,1,1,NOW(3))',
    ),
  );
  process.stdout.write(
    `Upgrade verified: ${tables.length} historical tables preserved; ${oldLinks.length} existing FKs retained.\n`,
  );
} finally {
  for (const name of created) {
    assert.match(name, /^scms_sprint2_(new|upgrade)_test_[0-9]+$/);
    await connection.query(`DROP DATABASE \`${name}\``);
  }
  await connection.end();
}
