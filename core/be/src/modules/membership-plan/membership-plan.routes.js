import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize(PERMISSIONS.MEMBERSHIP_PLAN_READ), async (_req, res) => {
  sendSuccess(res, {
    data: await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  });
});
export default router;
