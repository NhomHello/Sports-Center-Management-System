import { Router } from 'express';
import { sendSuccess } from '../../common/utils/api-response.js';
import { prisma } from '../../config/db.js';

const router = Router();

/**
 * GET /health - kiem tra server + DB. Khong can dang nhap.
 */
router.get('/', async (_req, res) => {
  let database = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }
  sendSuccess(res, {
    data: { status: 'ok', database, uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

export default router;
