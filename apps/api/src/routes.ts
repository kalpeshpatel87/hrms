import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

apiRouter.use('/auth', authRoutes);

/**
 * Further module routers are mounted here as each module is built
 * (apps/api/src/modules/<module>/<module>.routes.ts), e.g.:
 *   apiRouter.use('/employees', employeeRoutes);
 */
