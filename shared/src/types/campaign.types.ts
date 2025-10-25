/**
 * Shared Campaign Analytics Types
 * For UTM tracking and campaign analysis
 */

/**
 * Campaign metrics for a specific UTM combination
 */
export interface CampaignMetrics {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  totalUsers: number;
  firstViewUsers: number; // Users where this was their first page view
  conversionRate: number; // Percentage of users who had first views
  avgSessionDuration?: number;
  bounceRate?: number;
}

/**
 * Campaign performance comparison
 */
export interface CampaignPerformance {
  source: string;
  medium: string;
  campaign: string;
  users: number;
  firstViews: number;
  conversionRate: number;
  avgPages: number;
}

/**
 * UTM campaign analysis request
 */
export interface CampaignAnalysisRequest {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * UTM campaign analysis response
 */
export interface CampaignAnalysisResponse {
  success: boolean;
  data?: {
    campaigns: CampaignMetrics[];
    summary: {
      totalCampaigns: number;
      totalUsers: number;
      topCampaign: CampaignMetrics | null;
    };
  };
  error?: string;
}
