import type {
  EventDTO,
  EventsResponse,
  EventResponse,
  EventQueryParams,
  FunnelAnalysisRequest,
  FunnelAnalysisResponse,
  CampaignAnalysisRequest,
  CampaignAnalysisResponse,
} from '@trainwell-funnel/shared';

/**
 * API Client for Trainwell Funnel Backend
 * Handles all HTTP requests to the server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Build query string from parameters
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<EventDTO> {
    const response = await this.fetch<EventResponse>(
      `/api/v1/events/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch event');
    }

    return response.data;
  }

  /**
   * Get multiple events with optional filters
   */
  async getEvents(params?: EventQueryParams): Promise<EventsResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.fetch<EventsResponse>(`/api/v1/events${queryString}`);
  }

  /**
   * Analyze funnel with configured steps and date range
   */
  async analyzeFunnel(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse> {
    return this.fetch<FunnelAnalysisResponse>('/api/v1/events/funnel', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetch('/health');
  }

  /**
   * Analyze campaign performance
   */
  async analyzeCampaigns(request: CampaignAnalysisRequest): Promise<CampaignAnalysisResponse> {
    return this.fetch<CampaignAnalysisResponse>('/api/v1/campaigns/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get first view insights by UTM source
   */
  async getFirstViewInsights(startDate: string, endDate: string): Promise<{
    success: boolean;
    data?: Array<{
      source: string;
      firstViewCount: number;
      uniqueUsers: number;
    }>;
    error?: string;
  }> {
    const queryString = this.buildQueryString({ startDate, endDate });
    return this.fetch(`/api/v1/campaigns/first-view-insights${queryString}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
