import { Router } from 'express';
import type { CampaignController } from '@/controllers/campaign.controller';

/**
 * Campaign Routes - UTM Campaign Analytics Endpoints
 * Creates routes with injected campaign controller
 * @param campaignController - Injected campaign controller
 */
export function createCampaignRoutes(campaignController: CampaignController): Router {
  const router = Router();

  /**
   * POST /api/v1/campaigns/analyze
   * Analyze campaign performance within a date range
   *
   * Request body:
   * {
   *   startDate: string (ISO 8601),
   *   endDate: string (ISO 8601),
   *   utm_source?: string,
   *   utm_medium?: string,
   *   utm_campaign?: string
   * }
   */
  router.post(
    '/analyze',
    campaignController.analyzeCampaigns.bind(campaignController)
  );

  /**
   * GET /api/v1/campaigns/first-view-insights
   * Get first page view insights by UTM source
   *
   * Query parameters:
   * - startDate: string (ISO 8601)
   * - endDate: string (ISO 8601)
   */
  router.get(
    '/first-view-insights',
    campaignController.getFirstViewInsights.bind(campaignController)
  );

  return router;
}
