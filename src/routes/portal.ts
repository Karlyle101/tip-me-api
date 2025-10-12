import { Router } from 'express';
import { renderTipPortal } from '../controllers/portalController';

export const portalRouter = Router();

portalRouter.get('/:handle', renderTipPortal);