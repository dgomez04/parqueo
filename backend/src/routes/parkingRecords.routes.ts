import { Router } from 'express';
import * as parkingRecordsController from '../controllers/parkingRecords.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', parkingRecordsController.getAllParkingRecords);
router.get('/active', parkingRecordsController.getActiveRecords);
router.get('/:id', parkingRecordsController.getParkingRecordById);
router.post('/entry', requireRole('ADMIN', 'SECURITY_OFFICER'), parkingRecordsController.createEntry);
router.post('/:id/exit', requireRole('ADMIN', 'SECURITY_OFFICER'), parkingRecordsController.createExit);

export default router;
