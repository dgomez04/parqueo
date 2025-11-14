import { Router } from 'express';
import * as vehiclesController from '../controllers/vehicles.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/search', vehiclesController.searchVehicleByLicensePlate);
router.get('/', vehiclesController.getAllVehicles);
router.get('/:id', vehiclesController.getVehicleById);
router.post('/', requireRole('ADMIN'), vehiclesController.createVehicle);
router.put('/:id', requireRole('ADMIN'), vehiclesController.updateVehicle);
router.delete('/:id', requireRole('ADMIN'), vehiclesController.deleteVehicle);

export default router;
