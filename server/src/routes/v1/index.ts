import { Router } from 'express';
import { createEventRoutes } from '@/routes/v1/event.routes';
import { createCampaignRoutes } from '@/routes/v1/campaign.routes';
import type { DependencyContainer } from '@/dependencies';

/**
 * V1 API Routes Factory
 * Aggregates all v1 routes with injected dependencies
 * @param dependencies - Dependency container with all controllers
 */
export function createV1Routes(dependencies: DependencyContainer): Router {
  const router = Router();

  // Mount event routes with injected controller
  const eventRoutes = createEventRoutes(dependencies.eventController);
  router.use('/events', eventRoutes);

  // Mount campaign routes with injected controller
  const campaignRoutes = createCampaignRoutes(dependencies.campaignController);
  router.use('/campaigns', campaignRoutes);

  return router;
}
