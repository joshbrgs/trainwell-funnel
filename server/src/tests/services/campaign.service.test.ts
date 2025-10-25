import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignService } from '@/services/campaign.service';
import { CampaignRepository } from '@/repositories/campaign.repository';
import type {
  CampaignAnalysisRequest,
  CampaignMetrics,
} from '@trainwell-funnel/shared';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
    startTimer: vi.fn(() => ({
      done: vi.fn(),
    })),
  },
}));

describe('CampaignService', () => {
  let campaignService: CampaignService;
  let mockRepository: Partial<CampaignRepository>;

  beforeEach(() => {
    mockRepository = {
      getCampaignMetrics: vi.fn(),
      getTopCampaigns: vi.fn(),
      getFirstViewBySource: vi.fn(),
    };

    campaignService = new CampaignService(
      mockRepository as CampaignRepository
    );
  });

  describe('analyzeCampaigns', () => {
    it('should analyze campaigns successfully', async () => {
      const mockCampaigns: CampaignMetrics[] = [
        {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'winter_2025',
          totalUsers: 100,
          firstViewUsers: 80,
          conversionRate: 80,
        },
        {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'winter_2025',
          totalUsers: 50,
          firstViewUsers: 40,
          conversionRate: 80,
        },
      ];

      mockRepository.getCampaignMetrics = vi
        .fn()
        .mockResolvedValue(mockCampaigns);

      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.campaigns).toEqual(mockCampaigns);
      expect(result.data?.summary).toMatchObject({
        totalCampaigns: 2,
        totalUsers: 150,
        topCampaign: mockCampaigns[0],
      });
      expect(mockRepository.getCampaignMetrics).toHaveBeenCalledWith(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z'),
        undefined,
        undefined,
        undefined
      );
    });

    it('should filter by UTM parameters', async () => {
      mockRepository.getCampaignMetrics = vi.fn().mockResolvedValue([]);

      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'winter_2025',
      };

      await campaignService.analyzeCampaigns(request);

      expect(mockRepository.getCampaignMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        'google',
        'cpc',
        'winter_2025'
      );
    });

    it('should handle empty campaigns', async () => {
      mockRepository.getCampaignMetrics = vi.fn().mockResolvedValue([]);

      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.success).toBe(true);
      expect(result.data?.campaigns).toEqual([]);
      expect(result.data?.summary).toMatchObject({
        totalCampaigns: 0,
        totalUsers: 0,
        topCampaign: null,
      });
    });

    it('should return error for invalid date format', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: 'invalid-date',
        endDate: '2025-01-31T23:59:59Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
      expect(mockRepository.getCampaignMetrics).not.toHaveBeenCalled();
    });

    it('should return error when start date is after end date', async () => {
      const request: CampaignAnalysisRequest = {
        startDate: '2025-02-01T00:00:00Z',
        endDate: '2025-01-01T00:00:00Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start date must be before end date');
      expect(mockRepository.getCampaignMetrics).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.getCampaignMetrics = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should calculate totalUsers correctly', async () => {
      const mockCampaigns: CampaignMetrics[] = [
        {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'q1',
          totalUsers: 100,
          firstViewUsers: 80,
          conversionRate: 80,
        },
        {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'q1',
          totalUsers: 75,
          firstViewUsers: 60,
          conversionRate: 80,
        },
        {
          utm_source: 'twitter',
          utm_medium: 'social',
          utm_campaign: 'q1',
          totalUsers: 25,
          firstViewUsers: 20,
          conversionRate: 80,
        },
      ];

      mockRepository.getCampaignMetrics = vi
        .fn()
        .mockResolvedValue(mockCampaigns);

      const request: CampaignAnalysisRequest = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      const result = await campaignService.analyzeCampaigns(request);

      expect(result.data?.summary.totalUsers).toBe(200);
    });
  });

  describe('getFirstViewInsights', () => {
    it('should get first view insights successfully', async () => {
      const mockInsights = [
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
      ];

      mockRepository.getFirstViewBySource = vi
        .fn()
        .mockResolvedValue(mockInsights);

      const result = await campaignService.getFirstViewInsights(
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInsights);
      expect(mockRepository.getFirstViewBySource).toHaveBeenCalledWith(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      );
    });

    it('should handle empty insights', async () => {
      mockRepository.getFirstViewBySource = vi.fn().mockResolvedValue([]);

      const result = await campaignService.getFirstViewInsights(
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error for invalid date format', async () => {
      const result = await campaignService.getFirstViewInsights(
        'invalid-date',
        '2025-01-31T23:59:59Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
      expect(mockRepository.getFirstViewBySource).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.getFirstViewBySource = vi
        .fn()
        .mockRejectedValue(new Error('Network timeout'));

      const result = await campaignService.getFirstViewInsights(
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      mockRepository.getFirstViewBySource = vi
        .fn()
        .mockRejectedValue('String error');

      const result = await campaignService.getFirstViewInsights(
        '2025-01-01T00:00:00Z',
        '2025-01-31T23:59:59Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
