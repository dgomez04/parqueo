import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/current-occupation', reportsController.getCurrentOccupation);

export default router;
