import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CampaignAnalysisRequest } from '@trainwell-funnel/shared';

/**
 * React Query hooks for campaign analytics API
 */

/**
 * Analyze campaign performance
 * Uses mutation since it's a POST request with filters
 */
export function useCampaignAnalysis() {
  return useMutation({
    mutationFn: (request: CampaignAnalysisRequest) => apiClient.analyzeCampaigns(request),
  });
}

/**
 * Get first view insights by UTM source
 */
export function useFirstViewInsights(startDate: string | undefined, endDate: string | undefined) {
  return useMutation({
    mutationFn: () => {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      return apiClient.getFirstViewInsights(startDate, endDate);
    },
  });
}
