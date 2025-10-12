import { Router } from 'express';
import { getQrForHandle } from '../controllers/qrController';

export const qrRouter = Router();

qrRouter.get('/:handle', getQrForHandle);
