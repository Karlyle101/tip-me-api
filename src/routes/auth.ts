import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { authRequired } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authRequired, me);
