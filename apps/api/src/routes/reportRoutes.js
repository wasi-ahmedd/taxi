import { Router } from 'express';
import { reportSummaryHandler } from '../controllers/reportController.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/summary', authRequired, requireRole('admin'), reportSummaryHandler);

export default router;
