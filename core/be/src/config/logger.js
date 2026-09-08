/**
 * Logger dung chung (pino). Dev: in mau de doc; prod: JSON.
 * Dung: logger.info({ userId }, 'message') - object truoc, message sau.
 */
import pino from 'pino';
import { env, isDev, isTest } from './env.js';

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
});
