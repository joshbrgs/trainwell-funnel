import { ObjectId } from 'mongodb';
import type { EventDocument } from '@/models/event.model';

/**
 * Test fixtures for event documents
 */

export const createMockEventDocument = (
  overrides?: Partial<EventDocument>
): EventDocument => ({
  _id: new ObjectId(),
  user_id: 'user_123',
  session_id: 'session_456',
  device_id: 'device_789',
  platform: 'web',
  type: 'page_view',
  date: new Date('2025-01-15T10:00:00.000Z'),
  content: {
    path: '/homepage',
    hostname: 'www.trainwell.net',
    first_view: true,
    utm: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'winter_2025',
      utm_term: null,
      utm_content: null,
    },
  },
  version: '1.0.0',
  ...overrides,
});

export const mockEvents: EventDocument[] = [
  createMockEventDocument({
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    user_id: 'user_1',
    content: {
      path: '/homepage',
      hostname: 'www.trainwell.net',
      first_view: true,
      utm: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'winter_2025',
        utm_term: null,
        utm_content: null,
      },
    },
  }),
  createMockEventDocument({
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    user_id: 'user_1',
    content: {
      path: '/pricing',
      hostname: 'www.trainwell.net',
      first_view: false,
      utm: null,
    },
  }),
  createMockEventDocument({
    _id: new ObjectId('507f1f77bcf86cd799439013'),
    user_id: 'user_2',
    content: {
      path: '/homepage',
      hostname: 'www.trainwell.net',
      first_view: true,
      utm: {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'winter_2025',
        utm_term: null,
        utm_content: null,
      },
    },
  }),
];
