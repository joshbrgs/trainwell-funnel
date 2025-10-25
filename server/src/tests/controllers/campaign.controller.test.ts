import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignController } from '@/controllers/campaign.controller';
import { CampaignService } from '@/services/campaign.service';
import type { Request, Response } from 'express';
import type { CampaignAnalysisRequest } from '@trainwell-funnel/shared';

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

describe('CampaignController', () => {
  let campaignController: CampaignController;
  let mockService: Partial<CampaignService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      analyzeCampaigns: vi.fn(),
      getFirstViewInsights: vi.fn(),
    };

    campaignController = new CampaignController(
      mockService as CampaignService
    );

    mockRequest = {
      body: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('analyzeCampaigns', () => {
    it('should analyze campaigns successfully', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        success: true,
        data: {
          campaigns: [
            {
              utm_source: 'google',
              utm_medium: 'cpc',
              utm_campaign: 'winter_2025',
              totalUsers: 100,
              firstViewUsers: 80,
              conversionRate: 80,
            },
          ],
          summary: {
            totalCampaigns: 1,
            totalUsers: 100,
            topCampaign: {
              utm_source: 'google',
              utm_medium: 'cpc',
              utm_campaign: 'winter_2025',
              totalUsers: 100,
              firstViewUsers: 80,
              conversionRate: 80,
            },
          },
        },
      };

      mockRequest.body = request;
      mockService.analyzeCampaigns = vi.fn().mockResolvedValue(mockResult);

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.analyzeCampaigns).toHaveBeenCalledWith(request);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).not.toHaveBeenCalledWith(400);
    });

    it('should return 400 when startDate is missing', async () => {
      mockRequest.body = {
        endDate: '2025-01-31T23:59:59Z',
      };

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'startDate and endDate are required',
      });
      expect(mockService.analyzeCampaigns).not.toHaveBeenCalled();
    });

    it('should return 400 when endDate is missing', async () => {
      mockRequest.body = {
        startDate: '2025-01-01T00:00:00Z',
      };

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'startDate and endDate are required',
      });
      expect(mockService.analyzeCampaigns).not.toHaveBeenCalled();
    });

    it('should handle service errors with 400 status', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        success: false,
        error: 'Invalid date format',
      };

      mockRequest.body = request;
      mockService.analyzeCampaigns = vi.fn().mockResolvedValue(mockResult);

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle UTM filters', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'winter_2025',
      };

      const mockResult = {
        success: true,
        data: {
          campaigns: [],
          summary: {
            totalCampaigns: 0,
            totalUsers: 0,
            topCampaign: null,
          },
        },
      };

      mockRequest.body = request;
      mockService.analyzeCampaigns = vi.fn().mockResolvedValue(mockResult);

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.analyzeCampaigns).toHaveBeenCalledWith(request);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 500 on unexpected errors', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRequest.body = request;
      mockService.analyzeCampaigns = vi
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockRequest.body = request;
      mockService.analyzeCampaigns = vi.fn().mockRejectedValue('String error');

      await campaignController.analyzeCampaigns(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('getFirstViewInsights', () => {
    it('should get first view insights successfully', async () => {
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        success: true,
        data: [
          {
            source: 'google',
            firstViewCount: 100,
            uniqueUsers: 90,
          },
          {
            source: 'facebook',
            firstViewCount: 50,
            uniqueUsers: 45,
          },
        ],
      };

      mockService.getFirstViewInsights = vi.fn().mockResolvedValue(mockResult);

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getFirstViewInsights).toHaveBeenCalledWith(
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockResponse.status).not.toHaveBeenCalledWith(400);
    });

    it('should return 400 when startDate is missing', async () => {
      mockRequest.query = {
        endDate: '2025-01-31T23:59:59Z',
      };

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'startDate and endDate query parameters are required',
      });
      expect(mockService.getFirstViewInsights).not.toHaveBeenCalled();
    });

    it('should return 400 when endDate is missing', async () => {
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
      };

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'startDate and endDate query parameters are required',
      });
      expect(mockService.getFirstViewInsights).not.toHaveBeenCalled();
    });

    it('should handle service errors with 400 status', async () => {
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        success: false,
        error: 'Invalid date format',
      };

      mockService.getFirstViewInsights = vi.fn().mockResolvedValue(mockResult);

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 500 on unexpected errors', async () => {
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      mockService.getFirstViewInsights = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });

    it('should handle empty insights', async () => {
      mockRequest.query = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const mockResult = {
        success: true,
        data: [],
      };

      mockService.getFirstViewInsights = vi.fn().mockResolvedValue(mockResult);

      await campaignController.getFirstViewInsights(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
