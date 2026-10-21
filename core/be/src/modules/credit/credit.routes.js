import { Router } from 'express';

const router = Router();

/** GY-00 placeholder; GY-33 implements credit transactions and authorization. */
router.use((_req, res) => {
  res.status(501).json({ success: false, data: null, message: 'Chức năng đang phát triển' });
});

export default router;
