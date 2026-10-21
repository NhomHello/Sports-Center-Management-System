import { Router } from 'express';

const router = Router();
const NOT_IMPLEMENTED_STATUS = 501;

/** GY-00 placeholder; GY-35 implements purchase change authorization and settlement. */
router.use((_req, res) => {
  res.status(NOT_IMPLEMENTED_STATUS).json({ success: false, data: null, message: 'Chức năng đang phát triển' });
});

export default router;
