/**
 * Entry point: chay `npm run dev` (node --watch) hoac `npm start`.
 */
import { startMembershipReminderJob } from './modules/notification/notification.job.js';
import { startWaitlistWorker } from './modules/class/class-waitlist.service.js';
import { startCourseCompletionWorker } from './modules/course-summary/course-completion.job.js';
import { app } from './app.js';
import { prisma } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startClassEventWorker } from './modules/class/class-event.service.js';
import { startInvoiceExpiryWorker } from './modules/payment/invoice-expiry.job.js';

const stopCourseCompletion = startCourseCompletionWorker();
const stopWaitlist = startWaitlistWorker();
const stopMembershipJob = startMembershipReminderJob();
const stopClassEventWorker = startClassEventWorker();
const stopInvoiceExpiryWorker = startInvoiceExpiryWorker();

const server = app.listen(env.PORT, () => {
  logger.info(`API san sang tai http://localhost:${env.PORT}${env.API_PREFIX} (${env.NODE_ENV})`);
});

/**
 * Tat server nhe nhang: ngung nhan request moi, dong ket noi DB.
 * @param {string} signal
 */
const shutdown = async (signal) => {
  logger.info({ signal }, 'Dang tat server...');
  stopCourseCompletion();
  stopWaitlist();
  stopMembershipJob();
  stopClassEventWorker();
  stopInvoiceExpiryWorker();
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
