import { Router } from 'express';
import { createTip, getIncomingTips, getOutgoingTips } from '../controllers/tipsController';
import { authRequired } from '../middleware/auth';

export const tipsRouter = Router();

tipsRouter.post('/', createTip); // public endpoint to create a tip intent

tipsRouter.get('/incoming', authRequired, getIncomingTips);
tipsRouter.get('/outgoing', authRequired, getOutgoingTips);
