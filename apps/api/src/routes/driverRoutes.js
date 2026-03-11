import { Router } from 'express';
import {
  createDriverHandler,
  deactivateDriverHandler,
  listDriversHandler,
  updateDriverHandler,
} from '../controllers/driverController.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authRequired, requireRole('admin'));
router.post('/', createDriverHandler);
router.get('/', listDriversHandler);
router.patch('/:id', updateDriverHandler);
router.patch('/:id/deactivate', deactivateDriverHandler);

export default router;
