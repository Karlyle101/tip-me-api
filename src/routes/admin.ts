import { Router } from 'express';
import { adminRequired } from '../middleware/auth';
import { listUsers, listTips, updateTipStatus, listPayouts, updatePayoutStatus } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.use(adminRequired);

adminRouter.get('/users', listUsers);
adminRouter.get('/tips', listTips);
adminRouter.patch('/tips/:id/status', updateTipStatus);
adminRouter.get('/payouts', listPayouts);
adminRouter.patch('/payouts/:id/status', updatePayoutStatus);