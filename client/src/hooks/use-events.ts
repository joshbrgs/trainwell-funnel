import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { EventQueryParams, FunnelAnalysisRequest } from '@trainwell-funnel/shared';

/**
 * React Query hooks for events API
 */

/**
 * Get a single event by ID
 */
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => apiClient.getEvent(id!),
    enabled: !!id, // Only run if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get multiple events with filters
 */
export function useEvents(params?: EventQueryParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => apiClient.getEvents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Analyze funnel with configured steps and date range
 * Uses mutation since it's a POST request and we want manual triggering
 */
export function useFunnelAnalysis() {
  return useMutation({
    mutationFn: (request: FunnelAnalysisRequest) => apiClient.analyzeFunnel(request),
  });
}

/**
 * Health check query
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
