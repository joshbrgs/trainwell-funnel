import { Collection, Db } from 'mongodb';
import logger from '@/lib/logger';
import type { EventDocument } from '@/models/event.model';
import type { CampaignMetrics } from '@trainwell-funnel/shared';

/**
 * Campaign Repository - Data Access Layer for UTM Campaign Analytics
 * Responsible for executing MongoDB queries for campaign tracking
 */
export class CampaignRepository {
  private collection: Collection<EventDocument>;

  constructor(db: Db) {
    this.collection = db.collection<EventDocument>('events');
  }

  /**
   * Get campaign metrics aggregated by UTM parameters
   * Analyzes campaign effectiveness, first page views, and user engagement
   * Extracts UTM parameters from queryString field
   */
  async getCampaignMetrics(
    startDate: Date,
    endDate: Date,
    utm_source?: string,
    utm_medium?: string,
    utm_campaign?: string
  ): Promise<CampaignMetrics[]> {
    const timer = logger.startTimer();

    try {
      const matchConditions: any = {
        platform: 'web',
        type: 'page_view',
        date: { $gte: startDate, $lte: endDate },
        'content.queryString': { $exists: true, $nin: [null, ''] }, // Only events with query strings
      };

      const pipeline: any[] = [
        { $match: matchConditions },
        // Add fields to extract UTM parameters from queryString
        {
          $addFields: {
            utm_source: {
              $regexFind: { input: '$content.queryString', regex: /utm_source=([^&]+)/ },
            },
            utm_medium: {
              $regexFind: { input: '$content.queryString', regex: /utm_medium=([^&]+)/ },
            },
            utm_campaign: {
              $regexFind: { input: '$content.queryString', regex: /utm_campaign=([^&]+)/ },
            },
          },
        },
        // Extract the captured group from regex results
        {
          $addFields: {
            utm_source: { $arrayElemAt: ['$utm_source.captures', 0] },
            utm_medium: { $arrayElemAt: ['$utm_medium.captures', 0] },
            utm_campaign: { $arrayElemAt: ['$utm_campaign.captures', 0] },
          },
        },
        // Filter out events without any UTM parameters
        {
          $match: {
            $or: [
              { utm_source: { $ne: null } },
              { utm_medium: { $ne: null } },
              { utm_campaign: { $ne: null } },
            ],
          },
        },
      ];

      // Add optional UTM filters
      if (utm_source) {
        pipeline.push({ $match: { utm_source } });
      }
      if (utm_medium) {
        pipeline.push({ $match: { utm_medium } });
      }
      if (utm_campaign) {
        pipeline.push({ $match: { utm_campaign } });
      }

      pipeline.push(
        {
          $group: {
            _id: {
              source: '$utm_source',
              medium: '$utm_medium',
              campaign: '$utm_campaign',
            },
            totalUsers: { $addToSet: '$user_id' },
            firstViewUsers: {
              $sum: {
                $cond: [{ $eq: ['$content.first_view', true] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            utm_source: '$_id.source',
            utm_medium: '$_id.medium',
            utm_campaign: '$_id.campaign',
            totalUsers: { $size: '$totalUsers' },
            firstViewUsers: 1,
            conversionRate: {
              $multiply: [
                { $divide: ['$firstViewUsers', { $size: '$totalUsers' }] },
                100,
              ],
            },
          },
        },
        { $sort: { totalUsers: -1 } }
      );

      const results = await this.collection.aggregate(pipeline).toArray();

      timer.done({
        message: 'Repository: getCampaignMetrics completed',
        operation: 'getCampaignMetrics',
        campaignCount: results.length,
        filters: { utm_source, utm_medium, utm_campaign },
      });

      return results as CampaignMetrics[];
    } catch (error) {
      timer.done({
        level: 'error',
        message: 'Repository: Error getting campaign metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get top performing campaigns by user count
   */
  async getTopCampaigns(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<CampaignMetrics[]> {
    const timer = logger.startTimer();

    try {
      const matchConditions: any = {
        platform: 'web',
        type: 'page_view',
        date: { $gte: startDate, $lte: endDate },
        'content.utm': { $ne: null },
      };

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: {
              source: '$content.utm.utm_source',
              medium: '$content.utm.utm_medium',
              campaign: '$content.utm.utm_campaign',
            },
            totalUsers: { $addToSet: '$user_id' },
            firstViewUsers: {
              $sum: {
                $cond: [{ $eq: ['$content.first_view', true] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            utm_source: '$_id.source',
            utm_medium: '$_id.medium',
            utm_campaign: '$_id.campaign',
            totalUsers: { $size: '$totalUsers' },
            firstViewUsers: 1,
          },
        },
        { $sort: { totalUsers: -1 } },
        { $limit: limit },
      ];

      const results = await this.collection.aggregate(pipeline).toArray();

      timer.done({
        message: 'Repository: getTopCampaigns completed',
        operation: 'getTopCampaigns',
        campaignCount: results.length,
        limit,
      });

      return results as CampaignMetrics[];
    } catch (error) {
      timer.done({
        level: 'error',
        message: 'Repository: Error getting top campaigns',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get first page view breakdown by UTM source
   * Useful for understanding where users are first discovering your site
   * Extracts UTM source from queryString field
   */
  async getFirstViewBySource(startDate: Date, endDate: Date): Promise<any[]> {
    const timer = logger.startTimer();

    try {
      const pipeline: any[] = [
        {
          $match: {
            platform: 'web',
            type: 'page_view',
            date: { $gte: startDate, $lte: endDate },
            'content.first_view': true,
            'content.queryString': { $exists: true, $nin: [null, ''] },
          },
        },
        // Extract UTM source from queryString
        {
          $addFields: {
            utm_source: {
              $regexFind: { input: '$content.queryString', regex: /utm_source=([^&]+)/ },
            },
          },
        },
        {
          $addFields: {
            utm_source: { $arrayElemAt: ['$utm_source.captures', 0] },
          },
        },
        // Filter only events with UTM source
        {
          $match: {
            utm_source: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$utm_source',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user_id' },
          },
        },
        {
          $project: {
            _id: 0,
            source: '$_id',
            firstViewCount: '$count',
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { firstViewCount: -1 } },
      ];

      const results = await this.collection.aggregate(pipeline).toArray();

      timer.done({
        message: 'Repository: getFirstViewBySource completed',
        operation: 'getFirstViewBySource',
        sourceCount: results.length,
      });

      return results;
    } catch (error) {
      timer.done({
        level: 'error',
        message: 'Repository: Error getting first view by source',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
