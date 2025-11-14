import { Router } from 'express';
import * as parkingController from '../controllers/parking.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Public endpoint - no authentication required for listing parkings (needed for login page)
router.get('/', parkingController.getAllParkings);

// Protected endpoints - require authentication and admin role
router.get('/:id', authenticateToken, requireRole('ADMIN'), parkingController.getParkingById);
router.post('/', authenticateToken, requireRole('ADMIN'), parkingController.createParking);
router.put('/:id', authenticateToken, requireRole('ADMIN'), parkingController.updateParking);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), parkingController.deleteParking);

export default router;
