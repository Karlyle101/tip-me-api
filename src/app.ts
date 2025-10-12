import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { config } from './config';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { tipsRouter } from './routes/tips';
import { qrRouter } from './routes/qr';
import { adminRouter } from './routes/admin';
import { portalRouter } from './routes/portal';
import { payoutsRouter } from './routes/payouts';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/tips', tipsRouter);
  app.use('/qr', qrRouter);
  app.use('/admin', adminRouter);
  app.use('/portal', portalRouter);
  app.use('/payouts', payoutsRouter);

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

if (require.main === module) {
  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`Tip Me API listening on port ${config.port}`);
  });
}
