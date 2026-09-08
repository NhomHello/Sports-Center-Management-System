/**
 * Prisma client singleton. Import { prisma } tu day, KHONG tu new PrismaClient() o noi khac.
 * Prisma 7 yeu cau driver adapter: dung @prisma/adapter-mariadb cho MySQL.
 */
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import prismaPkg from '@prisma/client';
import { env, isDev } from './env.js';

// @prisma/client la CommonJS nen phai import default roi destructure
const { PrismaClient, UserStatus, SettingType } = prismaPkg;

const DEFAULT_MYSQL_PORT = 3306;
const CONNECTION_LIMIT = 10;

/**
 * Tach DATABASE_URL (mysql://user:pass@host:port/db) thanh config cho adapter.
 * @param {string} databaseUrl
 */
const parseDatabaseUrl = (databaseUrl) => {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || DEFAULT_MYSQL_PORT,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: CONNECTION_LIMIT,
  };
};

const adapter = new PrismaMariaDb(parseDatabaseUrl(env.DATABASE_URL));

export const prisma = new PrismaClient({
  adapter,
  log: isDev ? ['warn', 'error'] : ['error'],
});

/** Enum sinh tu schema.prisma - dung Enums.UserStatus.ACTIVE thay vi chuoi 'ACTIVE'. */
export const Enums = Object.freeze({ UserStatus, SettingType });
