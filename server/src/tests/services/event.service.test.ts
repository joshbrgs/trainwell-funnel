import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from '@/services/event.service';
import { EventRepository } from '@/repositories/event.repository';
import { createMockEventDocument, mockEvents } from '../fixtures/events.fixture';
import type { FunnelAnalysisRequest } from '@trainwell-funnel/shared';

// Mock the logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EventService', () => {
  let eventService: EventService;
  let mockRepository: Partial<EventRepository>;

  beforeEach(() => {
    // Create mock repository with all needed methods
    mockRepository = {
      findById: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      getUsersCompletingSequentialSteps: vi.fn(),
    };

    eventService = new EventService(mockRepository as EventRepository);
  });

  describe('getEventById', () => {
    it('should return serialized event when found', async () => {
      const mockEvent = createMockEventDocument();
      mockRepository.findById = vi.fn().mockResolvedValue(mockEvent);

      const result = await eventService.getEventById(mockEvent._id.toString());

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockEvent._id.toString());
      expect(result?.user_id).toBe(mockEvent.user_id);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        mockEvent._id.toString()
      );
    });

    it('should return null for invalid ObjectId format', async () => {
      const result = await eventService.getEventById('invalid-id');

      expect(result).toBeNull();
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return null when event not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(null);

      const result = await eventService.getEventById(
        '507f1f77bcf86cd799439011'
      );

      expect(result).toBeNull();
    });

    it('should throw error on repository failure', async () => {
      mockRepository.findById = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        eventService.getEventById('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Failed to retrieve event');
    });
  });

  describe('getEvents', () => {
    it('should return events with pagination', async () => {
      mockRepository.findMany = vi.fn().mockResolvedValue(mockEvents);
      mockRepository.count = vi.fn().mockResolvedValue(100);

      const result = await eventService.getEvents({ user_id: 'user_1' }, 10, 0);

      expect(result.events).toHaveLength(mockEvents.length);
      expect(result.total).toBe(100);
      expect(mockRepository.findMany).toHaveBeenCalledWith(
        { user_id: 'user_1' },
        10,
        0
      );
      expect(mockRepository.count).toHaveBeenCalledWith({ user_id: 'user_1' });
    });

    it('should use default pagination values', async () => {
      mockRepository.findMany = vi.fn().mockResolvedValue([]);
      mockRepository.count = vi.fn().mockResolvedValue(0);

      await eventService.getEvents({});

      expect(mockRepository.findMany).toHaveBeenCalledWith({}, 100, 0);
    });

    it('should handle date range filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockRepository.findMany = vi.fn().mockResolvedValue([]);
      mockRepository.count = vi.fn().mockResolvedValue(0);

      await eventService.getEvents({ startDate, endDate }, 50, 10);

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        { startDate, endDate },
        50,
        10
      );
    });

    it('should throw error on repository failure', async () => {
      mockRepository.findMany = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));
      mockRepository.count = vi.fn().mockResolvedValue(0);

      await expect(eventService.getEvents({})).rejects.toThrow(
        'Failed to retrieve events'
      );
    });
  });

  describe('analyzeFunnel', () => {
    it('should analyze funnel with sequential steps', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [
          { name: 'Homepage', matchType: 'path', matchValue: '/' },
          { name: 'Pricing', matchType: 'path', matchValue: '/pricing' },
          { name: 'Signup', matchType: 'path', matchValue: '/signup' },
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      // Mock users completing each step
      mockRepository.getUsersCompletingSequentialSteps = vi
        .fn()
        .mockResolvedValueOnce(['user_1', 'user_2', 'user_3']) // Step 0: 3 users
        .mockResolvedValueOnce(['user_1', 'user_2']) // Step 1: 2 users
        .mockResolvedValueOnce(['user_1']); // Step 2: 1 user

      const result = await eventService.analyzeFunnel(request);

      expect(result.steps).toHaveLength(3);
      expect(result.steps[0]).toMatchObject({
        step: 'Homepage',
        stepIndex: 0,
        users: 3,
        conversionRate: 100,
        dropoffRate: 0,
        stepConversionRate: 100,
      });
      expect(result.steps[1]).toMatchObject({
        step: 'Pricing',
        stepIndex: 1,
        users: 2,
        conversionRate: (2 / 3) * 100,
        stepConversionRate: (2 / 3) * 100,
      });
      expect(result.steps[2]).toMatchObject({
        step: 'Signup',
        stepIndex: 2,
        users: 1,
        conversionRate: (1 / 3) * 100,
        stepConversionRate: (1 / 2) * 100,
      });

      expect(result.summary).toMatchObject({
        totalUsers: 3,
        completedUsers: 1,
        overallConversionRate: (1 / 3) * 100,
      });
    });

    it('should handle single step funnel', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRepository.getUsersCompletingSequentialSteps = vi
        .fn()
        .mockResolvedValue(['user_1', 'user_2']);

      const result = await eventService.analyzeFunnel(request);

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toMatchObject({
        step: 'Homepage',
        users: 2,
        conversionRate: 100,
        dropoffRate: 0,
      });
      expect(result.summary).toMatchObject({
        totalUsers: 2,
        completedUsers: 2,
        overallConversionRate: 100,
      });
    });

    it('should handle funnel with no users', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRepository.getUsersCompletingSequentialSteps = vi
        .fn()
        .mockResolvedValue([]);

      const result = await eventService.analyzeFunnel(request);

      expect(result.steps[0]).toMatchObject({
        users: 0,
        conversionRate: 0,
      });
      expect(result.summary).toMatchObject({
        totalUsers: 0,
        completedUsers: 0,
        overallConversionRate: 0,
      });
    });

    it('should throw error for empty steps array', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      await expect(eventService.analyzeFunnel(request)).rejects.toThrow(
        'At least one funnel step is required'
      );
    });

    it('should throw error for invalid date format', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        startDate: 'invalid-date',
        endDate: '2025-01-31T23:59:59Z',
      };

      await expect(eventService.analyzeFunnel(request)).rejects.toThrow(
        'Invalid date format'
      );
    });

    it('should calculate average step conversion rate correctly', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [
          { name: 'Step 1', matchType: 'path', matchValue: '/1' },
          { name: 'Step 2', matchType: 'path', matchValue: '/2' },
          { name: 'Step 3', matchType: 'path', matchValue: '/3' },
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRepository.getUsersCompletingSequentialSteps = vi
        .fn()
        .mockResolvedValueOnce(['u1', 'u2', 'u3', 'u4']) // 4 users
        .mockResolvedValueOnce(['u1', 'u2', 'u3']) // 3 users (75% conversion)
        .mockResolvedValueOnce(['u1', 'u2']); // 2 users (66.67% conversion)

      const result = await eventService.analyzeFunnel(request);

      // Average step conversion: (75 + 66.67) / 2 = 70.835
      expect(result.summary.avgStepConversionRate).toBeCloseTo(70.83, 1);
    });

    it('should handle hostname matchType', async () => {
      const request: FunnelAnalysisRequest = {
        steps: [
          {
            name: 'Main Site',
            matchType: 'hostname',
            matchValue: 'www.trainwell.net',
          },
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRepository.getUsersCompletingSequentialSteps = vi
        .fn()
        .mockResolvedValue(['user_1']);

      const result = await eventService.analyzeFunnel(request);

      expect(result.steps[0]?.step).toBe('Main Site');
      expect(mockRepository.getUsersCompletingSequentialSteps).toHaveBeenCalled();
    });
  });
});
