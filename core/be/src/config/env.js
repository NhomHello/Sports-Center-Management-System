/**
 * NOI DUY NHAT doc process.env. Moi noi khac import { env } tu file nay.
 * Thieu / sai bien => server dung ngay khi khoi dong voi thong bao ro rang.
 */
import { z } from 'zod';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_PORT = 3000;
const DEFAULT_SALT_ROUNDS = 10;
const MIN_SALT_ROUNDS = 4;
const MAX_SALT_ROUNDS = 15;
const DEFAULT_RATE_WINDOW_MINUTES = 15;
const DEFAULT_RATE_MAX = 300;
const DEFAULT_AUTH_RATE_MAX = 20;
const DEFAULT_PERMISSION_CACHE_TTL = 30;
const DEFAULT_SETTING_CACHE_TTL = 60;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_MAIL_PORT = 587;

const csvToArray = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),

  DATABASE_URL: z.string().startsWith('mysql://', 'DATABASE_URL phai bat dau bang mysql://'),

  JWT_SECRET: z.string().min(MIN_SECRET_LENGTH, `JWT_SECRET phai >= ${MIN_SECRET_LENGTH} ky tu`),
  JWT_EXPIRES_IN: z.string().default('1d'),
  BCRYPT_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(MIN_SALT_ROUNDS)
    .max(MAX_SALT_ROUNDS)
    .default(DEFAULT_SALT_ROUNDS),

  CORS_ORIGINS: z.string().default('').transform(csvToArray),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(DEFAULT_RATE_WINDOW_MINUTES),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(DEFAULT_RATE_MAX),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(DEFAULT_AUTH_RATE_MAX),

  PERMISSION_CACHE_TTL_SECONDS: z.coerce.number().min(0).default(DEFAULT_PERMISSION_CACHE_TTL),
  SETTING_CACHE_TTL_SECONDS: z.coerce.number().min(0).default(DEFAULT_SETTING_CACHE_TTL),

  // Mail SMTP (Mailtrap Sandbox khi dev, Brevo/Gmail SMTP khi demo). Bo trong MAIL_HOST => chi ghi log.
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().default(DEFAULT_MAIL_PORT),
  MAIL_SECURE: z.stringbool().default(false),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Sports Center <no-reply@scms.local>'),
  /** URL goc cua FE de dung trong link trong email */
  APP_BASE_URL: z.url().default('http://localhost:5173'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(MIN_PASSWORD_LENGTH).optional(),
  SEED_ADMIN_NAME: z.string().default('Center Manager'),
  SEED_MOCK_DATA: z.stringbool().default(false),
  SEED_MOCK_PASSWORD: z.string().min(MIN_PASSWORD_LENGTH).default('Member@123'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  process.stderr.write(
    `\n[ENV] Bien moi truong khong hop le (xem core/be/.env.example):\n${lines.join('\n')}\n\n`,
  );
  process.exit(1);
}

/** @type {Readonly<z.infer<typeof schema>>} */
export const env = Object.freeze(parsed.data);

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
