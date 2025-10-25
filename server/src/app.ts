import express from 'express';
import cors from 'cors';
import { errorHandler } from '@/middleware/error.middleware';
import { loggerMiddleware } from '@/middleware/logger.middleware';
import { createApiRoutes } from '@/routes/index';
import type { DependencyContainer } from '@/dependencies';

/**
 * Create Express application
 * @param dependencies - Dependency container with all controllers
 */
export function createApp(dependencies: DependencyContainer) {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  app.use(express.json());
  app.use(loggerMiddleware);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API Routes
  const apiRoutes = createApiRoutes(dependencies);
  app.use('/api', apiRoutes);

  // Global error handler (should be after routes)
  app.use(errorHandler);

  return app;
}