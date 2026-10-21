import { Router } from 'express';

const router = Router();

/** GY-00 placeholder; GY-35 implements purchase change authorization and settlement. */
router.use((_req, res) => {
  res.status(501).json({ success: false, data: null, message: 'Chức năng đang phát triển' });
});

export default router;
