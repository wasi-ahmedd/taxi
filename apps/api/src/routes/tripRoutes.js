import { Router } from 'express';
import {
  acceptTripHandler,
  assignDriverHandler,
  completeTripHandler,
  createTripHandler,
  listTripsHandler,
  startTripHandler,
} from '../controllers/tripController.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authRequired);
router.post('/', requireRole('admin'), createTripHandler);
router.get('/', listTripsHandler);
router.patch('/:id/assign', requireRole('admin'), assignDriverHandler);
router.patch('/:id/accept', requireRole('admin', 'driver'), acceptTripHandler);
router.patch('/:id/start', requireRole('admin', 'driver'), startTripHandler);
router.patch('/:id/complete', requireRole('admin', 'driver'), completeTripHandler);

export default router;
