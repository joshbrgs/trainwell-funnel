/**
 * Shared Funnel Analysis Types
 * These types are shared between client and server
 */

/**
 * Funnel step configuration
 */
export interface FunnelStepConfig {
  name: string;
  matchType: 'path' | 'hostname';
  matchValue: string;
}

/**
 * Funnel analysis request
 */
export interface FunnelAnalysisRequest {
  steps: FunnelStepConfig[];
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
}

/**
 * Individual funnel step result
 */
export interface FunnelStepResult {
  step: string;
  stepIndex: number;
  users: number;
  conversionRate: number; // Percentage of users from step 1
  dropoffRate: number; // Percentage lost from previous step
  stepConversionRate: number; // Percentage retained from previous step
}

/**
 * Complete funnel analysis response
 */
export interface FunnelAnalysisResponse {
  success: boolean;
  data?: {
    steps: FunnelStepResult[];
    summary: {
      totalUsers: number;
      completedUsers: number;
      overallConversionRate: number;
      avgStepConversionRate: number;
    };
  };
  error?: string;
}
