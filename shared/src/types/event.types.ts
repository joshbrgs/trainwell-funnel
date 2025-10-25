/**
 * Shared Event Types
 * These types are shared between client and server
 * Contains only DTOs - no database-specific types
 */

/**
 * Platform types for analytics events
 */
export type Platform = 'web' | 'ios' | 'android';

/**
 * Event types for analytics
 */
export type EventType = 'page_view';

/**
 * UTM parameters for campaign tracking
 */
export interface UTMParameters {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

/**
 * Content structure for page view events
 */
export interface PageViewContent {
  path: string;
  first_view: boolean;
  hostname: string;
  utm?: UTMParameters | null;
}

/**
 * Event DTO (Data Transfer Object)
 * Used for API requests and responses
 */
export interface EventDTO {
  id: string;
  user_id: string;
  session_id: string;
  device_id: string | null;
  platform: Platform;
  type: EventType;
  date: string; // ISO 8601 date string
  content: PageViewContent;
  version: string | null;
}

/**
 * Event query parameters for filtering
 */
export interface EventQueryParams {
  user_id?: string;
  session_id?: string;
  type?: EventType;
  hostname?: string;
  path?: string;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  limit?: number;
  skip?: number;
}

/**
 * API Response wrapper for single event
 */
export interface EventResponse {
  success: boolean;
  data?: EventDTO;
  error?: string;
}

/**
 * API Response wrapper for multiple events
 */
export interface EventsResponse {
  success: boolean;
  data?: EventDTO[];
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    count: number;
  };
  error?: string;
}
