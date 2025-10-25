import { Router } from 'express';
import { createV1Routes } from '@/routes/v1';
import type { DependencyContainer } from '@/dependencies';

/**
 * API Routes Factory
 * Aggregates all version routes with injected dependencies
 * @param dependencies - Dependency container with all controllers
 */
export function createApiRoutes(dependencies: DependencyContainer): Router {
  const router = Router();

  // Mount v1 routes with injected dependencies
  const v1Routes = createV1Routes(dependencies);
  router.use('/v1', v1Routes);

  return router;
}
