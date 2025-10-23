import { Router } from 'express';
import * as parkingSpacesController from '../controllers/parkingSpaces.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', parkingSpacesController.getAllParkingSpaces);
router.get('/available', parkingSpacesController.getAvailableSpaces);
router.get('/:id', parkingSpacesController.getParkingSpaceById);
router.post('/', requireRole('ADMIN'), parkingSpacesController.createParkingSpace);
router.put('/:id', requireRole('ADMIN'), parkingSpacesController.updateParkingSpace);
router.delete('/:id', requireRole('ADMIN'), parkingSpacesController.deleteParkingSpace);

export default router;
