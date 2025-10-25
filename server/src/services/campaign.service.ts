import logger from '@/lib/logger';
import type { CampaignRepository } from '@/repositories/campaign.repository';
import type {
  CampaignAnalysisRequest,
  CampaignAnalysisResponse,
  CampaignMetrics,
} from '@trainwell-funnel/shared';

/**
 * Campaign Service - Business Logic Layer for UTM Campaign Analytics
 * Orchestrates campaign analysis and metrics calculation
 */
export class CampaignService {
  constructor(private campaignRepository: CampaignRepository) {}

  /**
   * Analyze campaign performance within a date range
   * Returns campaign metrics, top performers, and first view insights
   */
  async analyzeCampaigns(
    request: CampaignAnalysisRequest
  ): Promise<CampaignAnalysisResponse> {
    const timer = logger.startTimer();

    try {
      logger.info('Service: Starting campaign analysis', {
        startDate: request.startDate,
        endDate: request.endDate,
        filters: {
          utm_source: request.utm_source,
          utm_medium: request.utm_medium,
          utm_campaign: request.utm_campaign,
        },
      });

      // Parse dates
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }

      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }

      // Get campaign metrics
      const campaigns = await this.campaignRepository.getCampaignMetrics(
        startDate,
        endDate,
        request.utm_source,
        request.utm_medium,
        request.utm_campaign
      );

      // Calculate summary
      const totalUsers = campaigns.reduce(
        (sum, campaign) => sum + campaign.totalUsers,
        0
      );

      const topCampaign: CampaignMetrics | null = campaigns.length > 0 ? campaigns[0]! : null;

      timer.done({
        message: 'Service: Campaign analysis completed',
        operation: 'analyzeCampaigns',
        campaignCount: campaigns.length,
        totalUsers,
      });

      return {
        success: true,
        data: {
          campaigns,
          summary: {
            totalCampaigns: campaigns.length,
            totalUsers,
            topCampaign,
          },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      timer.done({
        level: 'error',
        message: 'Service: Error analyzing campaigns',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get first page view insights by UTM source
   * Helps understand where users first discover the site
   */
  async getFirstViewInsights(startDate: string, endDate: string) {
    const timer = logger.startTimer();

    try {
      logger.info('Service: Getting first view insights', {
        startDate,
        endDate,
      });

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }

      const insights = await this.campaignRepository.getFirstViewBySource(
        start,
        end
      );

      timer.done({
        message: 'Service: First view insights completed',
        operation: 'getFirstViewInsights',
        insightCount: insights.length,
      });

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      timer.done({
        level: 'error',
        message: 'Service: Error getting first view insights',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
