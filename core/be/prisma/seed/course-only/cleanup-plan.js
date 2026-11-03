import prismaPkg from '@prisma/client';
import { prisma } from '../../../src/config/db.js';

/** Cấu hình và tài khoản quản trị được giữ; dữ liệu nghiệp vụ/legacy được tạo lại. */
export const PRESERVED_TABLES = Object.freeze([
  '_prisma_migrations',
  'permissions',
  'roles',
  'role_permissions',
  'system_settings',
  'users',
  'operating_frames',
  'schedule_locks',
]);
const MODEL_TABLES = new Set(prismaPkg.Prisma.dmmf.datamodel.models.map((m) => m.dbName ?? m.name));

/** Chỉ nhận định danh từ metadata DB, không nối đầu vào người dùng vào SQL. */
export const quoteIdentifier = (value) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/u.test(value)) throw new Error('Định danh bảng/cột không hợp lệ');
  return `\`${value}\``;
};

/** Sắp thứ tự con → cha sau khi đã gỡ các liên kết nullable trong cùng transaction. */
export const deletionOrder = (tables, links) => {
  const remaining = new Set(tables);
  const order = [];
  while (remaining.size) {
    const leaves = [...remaining].filter(
      (table) =>
        !links.some((link) => link.targetTable === table && remaining.has(link.sourceTable)),
    );
    if (!leaves.length) throw new Error('Có chu trình khóa ngoại bắt buộc; từ chối dọn dữ liệu');
    for (const table of leaves.sort()) {
      order.push(table);
      remaining.delete(table);
    }
  }
  return order;
};

/** Đọc FK thực tế, gồm cả bảng legacy, để không phụ thuộc danh sách xoá viết tay đã cũ. */
export const buildCleanupPlan = async (db = prisma) => {
  const stored =
    await db.$queryRaw`SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`;
  const all = stored.map((row) => row.tableName);
  const unknown = all.filter((name) => !MODEL_TABLES.has(name) && !PRESERVED_TABLES.includes(name));
  if (unknown.length) throw new Error(`Bảng chưa được phân loại: ${unknown.join(', ')}`);
  const missing = [...MODEL_TABLES].filter((name) => !all.includes(name));
  if (missing.length)
    throw new Error(`Database thiếu bảng, cần chạy migration: ${missing.join(', ')}`);
  const tables = all.filter((name) => !PRESERVED_TABLES.includes(name));
  const foreignKeys =
    await db.$queryRaw`SELECT k.TABLE_NAME AS sourceTable, k.COLUMN_NAME AS sourceColumn, k.REFERENCED_TABLE_NAME AS targetTable, c.IS_NULLABLE AS isNullable FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.COLUMNS c ON c.TABLE_SCHEMA=k.TABLE_SCHEMA AND c.TABLE_NAME=k.TABLE_NAME AND c.COLUMN_NAME=k.COLUMN_NAME WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL`;
  const links = foreignKeys.filter(
    (f) => tables.includes(f.sourceTable) && tables.includes(f.targetTable),
  );
  const nullableLinks = links.filter((f) => f.isNullable === 'YES');
  const order = deletionOrder(
    tables,
    links.filter((f) => f.isNullable !== 'YES'),
  );
  return { order, nullableLinks, preserved: PRESERVED_TABLES };
};

/** Số hàng sẽ xoá; audit cấu hình role/setting được giữ nguyên. */
export const cleanupCounts = async (db, plan, adminId) => {
  const entries = await Promise.all(
    plan.order.map(async (table) => {
      const filter = table === 'audit_logs' ? " WHERE entity NOT IN ('Role', 'SystemSetting')" : '';
      const rows = await db.$queryRawUnsafe(
        `SELECT COUNT(*) AS total FROM ${quoteIdentifier(table)}${filter}`,
      );
      return [table, Number(rows[0].total)];
    }),
  );
  return {
    ...Object.fromEntries(entries),
    users: await db.user.count({ where: { id: { not: adminId } } }),
  };
};

/** Chạy trong transaction; không tắt FK, không TRUNCATE, không reset ID làm tái sử dụng JWT cũ. */
export const clearBusinessData = async (db, plan, adminId) => {
  for (const link of plan.nullableLinks) {
    const table = quoteIdentifier(link.sourceTable);
    const column = quoteIdentifier(link.sourceColumn);
    await db.$executeRawUnsafe(`UPDATE ${table} SET ${column} = NULL WHERE ${column} IS NOT NULL`);
  }
  const deleted = {};
  for (const table of plan.order) {
    const filter = table === 'audit_logs' ? " WHERE entity NOT IN ('Role', 'SystemSetting')" : '';
    deleted[table] = await db.$executeRawUnsafe(`DELETE FROM ${quoteIdentifier(table)}${filter}`);
  }
  deleted.users = (await db.user.deleteMany({ where: { id: { not: adminId } } })).count;
  await db.user.update({ where: { id: adminId }, data: { creditBalance: 0 } });
  return deleted;
};
