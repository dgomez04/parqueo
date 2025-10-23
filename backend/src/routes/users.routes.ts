import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), usersController.getAllUsers);
router.get('/:id', requireRole('ADMIN'), usersController.getUserById);
router.post('/', requireRole('ADMIN'), usersController.createUser);
router.put('/:id', requireRole('ADMIN'), usersController.updateUser);
router.delete('/:id', requireRole('ADMIN'), usersController.deleteUser);
router.post('/change-password', usersController.changePassword);

export default router;
