import { Router } from 'express';

export const apiRouter = Router();

/**
 * Module routers are mounted here as each module is built
 * (apps/api/src/modules/<module>/<module>.routes.ts), e.g.:
 *   apiRouter.use('/auth', authRoutes);
 *   apiRouter.use('/employees', employeeRoutes);
 */

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});
