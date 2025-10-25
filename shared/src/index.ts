/**
 * Shared types and utilities for Trainwell Funnel
 * Export all shared types that can be used by both client and server
 */

export type {
  Platform,
  EventType,
  PageViewContent,
  UTMParameters,
  EventDTO,
  EventQueryParams,
  EventResponse,
  EventsResponse,
} from './types/event.types';

export type {
  FunnelStepConfig,
  FunnelAnalysisRequest,
  FunnelStepResult,
  FunnelAnalysisResponse,
} from './types/funnel.types';

export type {
  CampaignMetrics,
  CampaignPerformance,
  CampaignAnalysisRequest,
  CampaignAnalysisResponse,
} from './types/campaign.types';
