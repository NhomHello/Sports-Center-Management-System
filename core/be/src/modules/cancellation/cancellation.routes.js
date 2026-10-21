import { Router } from 'express';

const router = Router();

/** GY-00: reserved routes; GY-32 will implement authorization and business rules. */
router.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    message: 'Chức năng đang phát triển',
  });
});

export default router;
