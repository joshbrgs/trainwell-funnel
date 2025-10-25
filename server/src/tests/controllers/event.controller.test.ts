import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventController } from '@/controllers/event.controller';
import { EventService } from '@/services/event.service';
import type { Request, Response, NextFunction } from 'express';
import { createMockEventDocument } from '../fixtures/events.fixture';
import { EventModel } from '@/models/event.model';
import type { FunnelAnalysisRequest } from '@trainwell-funnel/shared';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EventController', () => {
  let eventController: EventController;
  let mockService: Partial<EventService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      getEventById: vi.fn(),
      getEvents: vi.fn(),
      analyzeFunnel: vi.fn(),
    };

    eventController = new EventController(mockService as EventService);

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('getEventById', () => {
    it('should return event when found', async () => {
      const mockEvent = createMockEventDocument();
      const mockDTO = EventModel.toDTO(mockEvent);

      mockRequest.params = { id: mockEvent._id.toString() };
      mockService.getEventById = vi.fn().mockResolvedValue(mockDTO);

      await eventController.getEventById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getEventById).toHaveBeenCalledWith(
        mockEvent._id.toString()
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDTO,
      });
    });

    it('should return 400 when ID is missing', async () => {
      mockRequest.params = {};

      await eventController.getEventById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event ID is required',
      });
      expect(mockService.getEventById).not.toHaveBeenCalled();
    });

    it('should return 404 when event not found', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockService.getEventById = vi.fn().mockResolvedValue(null);

      await eventController.getEventById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event not found',
      });
    });

    it('should call next with error on service failure', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      const error = new Error('Service error');
      mockService.getEventById = vi.fn().mockRejectedValue(error);

      await eventController.getEventById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getEvents', () => {
    it('should return events with pagination', async () => {
      const mockResult = {
        events: [EventModel.toDTO(createMockEventDocument())],
        total: 100,
      };

      mockRequest.query = { user_id: 'user_1', limit: '10', skip: '0' };
      mockService.getEvents = vi.fn().mockResolvedValue(mockResult);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getEvents).toHaveBeenCalledWith(
        { user_id: 'user_1' },
        10,
        0
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.events,
        pagination: {
          total: 100,
          limit: 10,
          skip: 0,
          count: 1,
        },
      });
    });

    it('should use default pagination values', async () => {
      const mockResult = { events: [], total: 0 };
      mockRequest.query = {};
      mockService.getEvents = vi.fn().mockResolvedValue(mockResult);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getEvents).toHaveBeenCalledWith({}, 100, 0);
    });

    it('should parse date filters correctly', async () => {
      const mockResult = { events: [], total: 0 };
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };
      mockService.getEvents = vi.fn().mockResolvedValue(mockResult);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getEvents).toHaveBeenCalledWith(
        {
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-01-31T23:59:59Z'),
        },
        100,
        0
      );
    });

    it('should ignore invalid date formats', async () => {
      const mockResult = { events: [], total: 0 };
      mockRequest.query = {
        startDate: 'invalid-date',
      };
      mockService.getEvents = vi.fn().mockResolvedValue(mockResult);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should be called with empty filters (invalid date ignored)
      expect(mockService.getEvents).toHaveBeenCalledWith({}, 100, 0);
    });

    it('should enforce limit bounds', async () => {
      const mockResult = { events: [], total: 0 };
      mockRequest.query = { limit: '5000' }; // Above max
      mockService.getEvents = vi.fn().mockResolvedValue(mockResult);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should use default (100) since 5000 > max
      expect(mockService.getEvents).toHaveBeenCalledWith({}, 100, 0);
    });

    it('should call next on service error', async () => {
      const error = new Error('Database error');
      mockService.getEvents = vi.fn().mockRejectedValue(error);

      await eventController.getEvents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('analyzeFunnel', () => {
    it('should analyze funnel successfully', async () => {
      const funnelRequest: FunnelAnalysisRequest = {
        steps: [
          { name: 'Homepage', matchType: 'path', matchValue: '/' },
          { name: 'Pricing', matchType: 'path', matchValue: '/pricing' },
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        steps: [
          {
            step: 'Homepage',
            stepIndex: 0,
            users: 100,
            conversionRate: 100,
            dropoffRate: 0,
            stepConversionRate: 100,
          },
          {
            step: 'Pricing',
            stepIndex: 1,
            users: 75,
            conversionRate: 75,
            dropoffRate: 25,
            stepConversionRate: 75,
          },
        ],
        summary: {
          totalUsers: 100,
          completedUsers: 75,
          overallConversionRate: 75,
          avgStepConversionRate: 75,
        },
      };

      mockRequest.body = funnelRequest;
      mockService.analyzeFunnel = vi.fn().mockResolvedValue(mockResult);

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.analyzeFunnel).toHaveBeenCalledWith(funnelRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 400 when steps array is missing', async () => {
      mockRequest.body = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'At least one funnel step is required',
      });
      expect(mockService.analyzeFunnel).not.toHaveBeenCalled();
    });

    it('should return 400 when steps array is empty', async () => {
      mockRequest.body = {
        steps: [],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'At least one funnel step is required',
      });
    });

    it('should return 400 when startDate is missing', async () => {
      mockRequest.body = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        endDate: '2025-01-31T23:59:59Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Start date and end date are required',
      });
    });

    it('should return 400 when endDate is missing', async () => {
      mockRequest.body = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        startDate: '2025-01-01T00:00:00Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Start date and end date are required',
      });
    });

    it('should return 400 when step is missing required fields', async () => {
      mockRequest.body = {
        steps: [{ name: 'Homepage', matchType: 'path' }], // missing matchValue
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each step must have name, matchType, and matchValue',
      });
    });

    it('should return 400 when matchType is invalid', async () => {
      mockRequest.body = {
        steps: [
          { name: 'Homepage', matchType: 'invalid', matchValue: '/' },
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'matchType must be either "path" or "hostname"',
      });
    });

    it('should validate hostname matchType', async () => {
      const funnelRequest: FunnelAnalysisRequest = {
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

      const mockResult = {
        steps: [
          {
            step: 'Main Site',
            stepIndex: 0,
            users: 50,
            conversionRate: 100,
            dropoffRate: 0,
            stepConversionRate: 100,
          },
        ],
        summary: {
          totalUsers: 50,
          completedUsers: 50,
          overallConversionRate: 100,
          avgStepConversionRate: 100,
        },
      };

      mockRequest.body = funnelRequest;
      mockService.analyzeFunnel = vi.fn().mockResolvedValue(mockResult);

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockService.analyzeFunnel).toHaveBeenCalledWith(funnelRequest);
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = {
        steps: [{ name: 'Homepage', matchType: 'path', matchValue: '/' }],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockService.analyzeFunnel = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await eventController.analyzeFunnel(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });
  });
});
