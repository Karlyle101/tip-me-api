import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import { requestPayout, listMyPayouts } from '../controllers/payoutsController';

export const payoutsRouter = Router();

payoutsRouter.use(authRequired);

// Barista (or any authenticated user) can request a payout for themselves
payoutsRouter.post('/request', requestPayout);

// List own payouts
payoutsRouter.get('/', listMyPayouts);