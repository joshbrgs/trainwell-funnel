import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignRepository } from '@/repositories/campaign.repository';
import { createMockDb, getMockCollectionMethods } from '../utils/mongodb-mock';

describe('CampaignRepository', () => {
  let campaignRepository: CampaignRepository;
  let mockCollection: ReturnType<typeof getMockCollectionMethods>;

  beforeEach(() => {
    const { db, collection } = createMockDb();
    campaignRepository = new CampaignRepository(db);
    mockCollection = getMockCollectionMethods(collection);
  });

  describe('getCampaignMetrics', () => {
    it('should get campaign metrics for date range', async () => {
      const mockMetrics = [
        {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'winter_2025',
          totalUsers: 100,
          firstViewUsers: 80,
        },
        {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'winter_2025',
          totalUsers: 50,
          firstViewUsers: 40,
        },
      ];

      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue(mockMetrics),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const result = await campaignRepository.getCampaignMetrics(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual(mockMetrics);
      expect(mockCollection.aggregate).toHaveBeenCalled();

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$match).toMatchObject({
        platform: 'web',
        type: 'page_view',
        'content.queryString': { $exists: true, $nin: [null, ''] },
      });
    });

    it('should filter by UTM source', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      await campaignRepository.getCampaignMetrics(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        'google'
      );

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      // Check that the pipeline includes a $match stage for utm_source
      const utmSourceMatch = aggregateCall.find(
        (stage: any) => stage.$match && stage.$match.utm_source === 'google'
      );
      expect(utmSourceMatch).toBeDefined();
    });

    it('should filter by UTM medium and campaign', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      await campaignRepository.getCampaignMetrics(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        undefined,
        'cpc',
        'winter_2025'
      );

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      // Check that the pipeline includes $match stages for utm_medium and utm_campaign
      const utmMediumMatch = aggregateCall.find(
        (stage: any) => stage.$match && stage.$match.utm_medium === 'cpc'
      );
      const utmCampaignMatch = aggregateCall.find(
        (stage: any) => stage.$match && stage.$match.utm_campaign === 'winter_2025'
      );
      expect(utmMediumMatch).toBeDefined();
      expect(utmCampaignMatch).toBeDefined();
    });
  });

  describe('getTopCampaigns', () => {
    it('should get top campaigns sorted by user count', async () => {
      const mockCampaigns = [
        {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'winter_2025',
          totalUsers: 100,
          firstViewUsers: 80,
        },
        {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'winter_2025',
          totalUsers: 50,
          firstViewUsers: 40,
        },
      ];

      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue(mockCampaigns),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const result = await campaignRepository.getTopCampaigns(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        5
      );

      expect(result).toEqual(mockCampaigns);

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      const limitStage = aggregateCall.find((stage: any) => stage.$limit);
      expect(limitStage).toEqual({ $limit: 5 });
    });

    it('should default to 10 campaigns', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      await campaignRepository.getTopCampaigns(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      const limitStage = aggregateCall.find((stage: any) => stage.$limit);
      expect(limitStage).toEqual({ $limit: 10 });
    });
  });

  describe('getFirstViewBySource', () => {
    it('should get first view breakdown by source', async () => {
      const mockInsights = [
        {
          source: 'google',
          firstViewCount: 80,
          uniqueUsers: 75,
        },
        {
          source: 'facebook',
          firstViewCount: 40,
          uniqueUsers: 38,
        },
      ];

      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue(mockInsights),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      const result = await campaignRepository.getFirstViewBySource(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(result).toEqual(mockInsights);

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$match).toMatchObject({
        platform: 'web',
        type: 'page_view',
        'content.first_view': true,
        'content.queryString': { $exists: true, $nin: [null, ''] },
      });
    });

    it('should sort by first view count descending', async () => {
      const mockAggregateCursor = {
        toArray: vi.fn().mockResolvedValue([]),
      };
      mockCollection.aggregate.mockReturnValue(mockAggregateCursor as any);

      await campaignRepository.getFirstViewBySource(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      const sortStage = aggregateCall.find((stage: any) => stage.$sort);
      expect(sortStage).toEqual({ $sort: { firstViewCount: -1 } });
    });
  });
});
