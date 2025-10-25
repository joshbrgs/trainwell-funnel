import type { Request, Response } from 'express';
import logger from '@/lib/logger';
import type { CampaignService } from '@/services/campaign.service';
import type { CampaignAnalysisRequest } from '@trainwell-funnel/shared';

/**
 * Campaign Controller - HTTP Request Handler for UTM Campaign Analytics
 * Handles validation and delegates to service layer
 */
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  /**
   * POST /api/v1/campaigns/analyze
   * Analyze campaign performance
   */
  async analyzeCampaigns(req: Request, res: Response): Promise<void> {
    try {
      logger.http('Controller: Received campaign analysis request', {
        body: req.body,
      });

      const request = req.body as CampaignAnalysisRequest;

      // Validate request
      if (!request.startDate || !request.endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const result = await this.campaignService.analyzeCampaigns(request);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

      logger.http('Controller: Campaign analysis response sent', {
        success: result.success,
        campaignCount: result.data?.campaigns.length ?? 0,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Controller: Error in campaign analysis', {
        error: errorMessage,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/v1/campaigns/first-view-insights
   * Get first page view insights by UTM source
   */
  async getFirstViewInsights(req: Request, res: Response): Promise<void> {
    try {
      logger.http('Controller: Received first view insights request', {
        query: req.query,
      });

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
        return;
      }

      const result = await this.campaignService.getFirstViewInsights(
        startDate as string,
        endDate as string
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

      logger.http('Controller: First view insights response sent', {
        success: result.success,
        insightCount: result.data?.length ?? 0,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('Controller: Error in first view insights', {
        error: errorMessage,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
