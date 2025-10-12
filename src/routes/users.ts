import { Router } from 'express';
import { getMe } from '../controllers/usersController';
import { authRequired } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.get('/me', authRequired, getMe);
