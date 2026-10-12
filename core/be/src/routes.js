/**
 * Gom tat ca route cua cac module.
 * Prefix chung (/api/v1) lay tu env.API_PREFIX trong app.js.
 */

import { Router } from 'express';

import { HEALTH_PATH } from './constants/index.js';

import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import invoiceRoutes from './modules/payment/invoice.routes.js';
import memberRoutes from './modules/member/member.routes.js';
import membershipPlanRoutes from './modules/membership-plan/membership-plan.routes.js';
import membershipRoutes from './modules/membership/membership.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import permissionRoutes from './modules/permission/permission.routes.js';
import roleRoutes from './modules/role/role.routes.js';
import roomRoutes from './modules/room/room.routes.js';
import settingRoutes from './modules/setting/setting.routes.js';
import subjectRoutes from './modules/subject/subject.routes.js';
import userRoutes from './modules/user/user.routes.js';

const router = Router();

router.use(HEALTH_PATH, healthRoutes);
router.use('/auth', authRoutes);

router.use('/members', memberRoutes);
router.use('/memberships', membershipRoutes);
router.use('/membership-plans', membershipPlanRoutes);

router.use('/subjects', subjectRoutes);
router.use('/rooms', roomRoutes);

router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRoutes);

router.use('/notifications', notificationRoutes);
router.use('/permissions', permissionRoutes);
router.use('/roles', roleRoutes);
router.use('/settings', settingRoutes);
router.use('/users', userRoutes);

export default router;
