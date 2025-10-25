import { ObjectId } from 'mongodb';
import type { Platform, EventType, PageViewContent, EventDTO } from '@trainwell-funnel/shared';

/**
 * MongoDB document structure for analytics events
 * This is server-only - contains database-specific types (ObjectId, Date)
 */
export interface EventDocument {
  _id: ObjectId;
  user_id: string;
  session_id: string;
  device_id: string | null;
  platform: Platform;
  type: EventType;
  date: Date;
  content: PageViewContent;
  version: string | null;
}

// Re-export shared types for convenience
export type { Platform, EventType, PageViewContent, EventDTO };

/**
 * Query filters for events
 */
export interface EventQueryFilters {
  user_id?: string;
  session_id?: string;
  platform?: Platform;
  type?: EventType;
  hostname?: string;
  path?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Event Model - Serialization utilities
 */
export class EventModel {
  /**
   * Serialize MongoDB document to DTO
   * Converts ObjectId to string and Date to ISO string for JSON responses
   * @param document - MongoDB event document
   * @returns EventDTO suitable for API responses
   */
  static toDTO(document: EventDocument): EventDTO {
    return {
      id: document._id.toString(),
      user_id: document.user_id,
      session_id: document.session_id,
      device_id: document.device_id,
      platform: document.platform,
      type: document.type,
      date: document.date.toISOString(),
      content: document.content,
      version: document.version,
    };
  }

  /**
   * Serialize multiple MongoDB documents to DTOs
   * @param documents - Array of MongoDB event documents
   * @returns Array of EventDTOs
   */
  static toDTOs(documents: EventDocument[]): EventDTO[] {
    return documents.map((doc) => this.toDTO(doc));
  }

  /**
   * Validate ObjectId format
   * @param id - String to validate as ObjectId
   * @returns true if valid ObjectId format
   */
  static isValidObjectId(id: string): boolean {
    return /^[a-f\d]{24}$/i.test(id);
  }
}
