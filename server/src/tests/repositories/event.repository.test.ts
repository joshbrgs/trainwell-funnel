import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventRepository } from '@/repositories/event.repository';
import { createMockDb, getMockCollectionMethods } from '../utils/mongodb-mock';
import { createMockEventDocument, mockEvents } from '../fixtures/events.fixture';
import { ObjectId } from 'mongodb';

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  let mockCollection: ReturnType<typeof getMockCollectionMethods>;

  beforeEach(() => {
    const { db, collection } = createMockDb();
    eventRepository = new EventRepository(db);
    mockCollection = getMockCollectionMethods(collection);
  });

  describe('findById', () => {
    it('should find an event by ID', async () => {
      const mockEvent = createMockEventDocument();
      mockCollection.findOne.mockResolvedValue(mockEvent);

      const result = await eventRepository.findById(mockEvent._id.toString());

      expect(result).toEqual(mockEvent);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mockEvent._id,
        platform: 'web',
      });
    });

    it('should return null if event not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await eventRepository.findById(new ObjectId().toString());

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        eventRepository.findById(new ObjectId().toString())
      ).rejects.toThrow('Database error');
    });
  });

  describe('findMany', () => {
    it('should find events with filters', async () => {
      const mockFindCursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockEvents),
      };
      mockCollection.find.mockReturnValue(mockFindCursor as any);

      const result = await eventRepository.findMany(
        { user_id: 'user_1' },
        10,
        0
      );

      expect(result).toEqual(mockEvents);
      expect(mockCollection.find).toHaveBeenCalledWith({
        platform: 'web',
        user_id: 'user_1',
      });
      expect(mockFindCursor.limit).toHaveBeenCalledWith(10);
      expect(mockFindCursor.skip).toHaveBeenCalledWith(0);
    });

    it('should apply date range filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockFindCursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };
      mockCollection.find.mockReturnValue(mockFindCursor as any);

      await eventRepository.findMany({ startDate, endDate }, 10, 0);

      expect(mockCollection.find).toHaveBeenCalledWith({
        platform: 'web',
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });
  });

  describe('count', () => {
    it('should count events matching filters', async () => {
      mockCollection.countDocuments.mockResolvedValue(42);

      const result = await eventRepository.count({ user_id: 'user_1' });

      expect(result).toBe(42);
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        platform: 'web',
        user_id: 'user_1',
      });
    });
  });

  describe('getUsersForStep', () => {
    it('should get unique users for a step without previous users', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([
          { user_id: 'user_1' },
          { user_id: 'user_2' },
        ]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const result = await eventRepository.getUsersForStep(
        { name: 'Homepage', matchType: 'path', matchValue: '/homepage' },
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual(['user_1', 'user_2']);
      expect(mockCollection.aggregate).toHaveBeenCalled();
    });

    it('should filter by previous step users', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([{ user_id: 'user_1' }]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const result = await eventRepository.getUsersForStep(
        { name: 'Pricing', matchType: 'path', matchValue: '/pricing' },
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        ['user_1', 'user_2']
      );

      expect(result).toEqual(['user_1']);
      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$match).toMatchObject({
        user_id: { $in: ['user_1', 'user_2'] },
      });
    });

    it('should match by hostname when matchType is hostname', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([{ user_id: 'user_1' }]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      await eventRepository.getUsersForStep(
        {
          name: 'Homepage',
          matchType: 'hostname',
          matchValue: 'www.trainwell.net',
        },
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$match).toMatchObject({
        'content.hostname': 'www.trainwell.net',
      });
    });
  });

  describe('getUsersCompletingSequentialSteps', () => {
    it('should return all users for step 0', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([
          { user_id: 'user_1' },
          { user_id: 'user_2' },
        ]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const steps = [
        { name: 'Homepage', matchType: 'path' as const, matchValue: '/homepage' },
      ];

      const result = await eventRepository.getUsersCompletingSequentialSteps(
        steps,
        0,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual(['user_1', 'user_2']);
    });

    it('should progressively filter users through multiple steps', async () => {
      // First call: step 0 - returns 2 users
      // Second call: step 1 with previous users - returns 1 user
      const mockAggregateCursor1 = {
        toArray: vi.fn().mockResolvedValue([
          { user_id: 'user_1' },
          { user_id: 'user_2' },
        ]),
      };
      const mockAggregateCursor2 = {
        toArray: vi.fn().mockResolvedValue([{ user_id: 'user_1' }]),
      };

      mockCollection.aggregate
        .mockReturnValueOnce(mockAggregateCursor1 as any)
        .mockReturnValueOnce(mockAggregateCursor2 as any);

      const steps = [
        { name: 'Homepage', matchType: 'path' as const, matchValue: '/homepage' },
        { name: 'Pricing', matchType: 'path' as const, matchValue: '/pricing' },
      ];

      const result = await eventRepository.getUsersCompletingSequentialSteps(
        steps,
        1,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual(['user_1']);
      expect(mockCollection.aggregate).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid step index', async () => {
      const steps = [
        { name: 'Homepage', matchType: 'path' as const, matchValue: '/homepage' },
      ];

      await expect(
        eventRepository.getUsersCompletingSequentialSteps(
          steps,
          5,
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )
      ).rejects.toThrow('Invalid step index: 5');
    });
  });
});
