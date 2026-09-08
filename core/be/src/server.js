/**
 * Entry point: chay `npm run dev` (node --watch) hoac `npm start`.
 */
import { app } from './app.js';
import { prisma } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API san sang tai http://localhost:${env.PORT}${env.API_PREFIX} (${env.NODE_ENV})`);
});

/**
 * Tat server nhe nhang: ngung nhan request moi, dong ket noi DB.
 * @param {string} signal
 */
const shutdown = async (signal) => {
  logger.info({ signal }, 'Dang tat server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});
