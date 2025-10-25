import { Collection, Db, type Filter, ObjectId } from 'mongodb';
import logger from '@/lib/logger';
import type { EventDocument, EventQueryFilters } from '@/models/event.model';
import type { FunnelStepConfig } from '@trainwell-funnel/shared';

/**
 * Event Repository - Data Access Layer
 * Responsible for executing MongoDB queries
 * Uses dependency injection for better testability
 */
export class EventRepository {
  private collection: Collection<EventDocument>;

  /**
   * Constructor with dependency injection
   * @param db - MongoDB database instance (injected)
   */
  constructor(db: Db) {
    this.collection = db.collection<EventDocument>('events');
  }

  /**
   * Find an event by ID
   * Pre-filtered to only return web platform events
   */
  async findById(id: string): Promise<EventDocument | null> {
    const timer = logger.startTimer();
    try {
      logger.debug(`Repository: Finding event by ID: ${id}`);

      const objectId = new ObjectId(id);
      const event = await this.collection.findOne({
        _id: objectId,
        platform: 'web', // Pre-filter for web platform
      });

      timer.done({
        message: 'Repository: findById completed',
        operation: 'findById',
        id,
        found: !!event,
      });

      return event;
    } catch (error) {
      timer.done({
        level: 'error',
        message: `Repository: Error finding event by ID ${id}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find events with filters
   * Automatically filters for web platform
   */
  async findMany(
    filters: EventQueryFilters,
    limit: number = 100,
    skip: number = 0
  ): Promise<EventDocument[]> {
    const timer = logger.startTimer();
    try {
      logger.debug('Repository: Finding events with filters', filters);

      const query = this.buildQuery(filters);

      const events = await this.collection
        .find(query)
        .limit(limit)
        .skip(skip)
        .toArray();

      timer.done({
        message: 'Repository: findMany completed',
        operation: 'findMany',
        filters,
        limit,
        skip,
        resultCount: events.length,
      });

      return events;
    } catch (error) {
      timer.done({
        level: 'error',
        message: 'Repository: Error finding events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Count events matching filters
   */
  async count(filters: EventQueryFilters): Promise<number> {
    const timer = logger.startTimer();
    try {
      logger.debug('Repository: Counting events with filters', filters);

      const query = this.buildQuery(filters);
      const count = await this.collection.countDocuments(query);

      timer.done({
        message: 'Repository: count completed',
        operation: 'count',
        filters,
        count,
      });

      return count;
    } catch (error) {
      timer.done({
        level: 'error',
        message: 'Repository: Error counting events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get unique user_ids for events matching a step configuration
   * Used for funnel analysis to find users who completed a specific step
   *
   * OPTIMIZED FOR EXISTING INDEXES:
   * - Uses aggregation pipeline instead of distinct() for better index utilization
   * - Reorders match conditions to leverage user_id_1_date_1 index when filtering by previous users
   * - This works better with read-only database where new indexes cannot be created
   */
  async getUsersForStep(
    step: FunnelStepConfig,
    startDate: Date,
    endDate: Date,
    previousStepUsers?: string[]
  ): Promise<string[]> {
    const timer = logger.startTimer();

    try {
      // Build match conditions with optimal ordering for existing indexes
      const matchConditions: any = {
        platform: 'web',
        type: 'page_view',
      };

      // When filtering by previous users, put user_id first to leverage user_id_1_date_1 index
      if (previousStepUsers && previousStepUsers.length > 0) {
        matchConditions.user_id = { $in: previousStepUsers };
      }

      // Add date range (benefits from user_id_1_date_1 index when user_id is present)
      matchConditions.date = { $gte: startDate, $lte: endDate };

      // Add step-specific matching (benefits from user_id_1_content.hostname_1_content.path_1 index)
      if (step.matchType === 'path') {
        matchConditions['content.path'] = step.matchValue;
      } else {
        matchConditions['content.hostname'] = step.matchValue;
      }

      // Use aggregation pipeline for better performance with existing indexes
      const pipeline = [
        { $match: matchConditions },
        { $group: { _id: '$user_id' } },
        { $project: { _id: 0, user_id: '$_id' } },
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      const users = result.map((doc) => doc.user_id as string);

      timer.done({
        message: 'Repository: getUsersForStep completed',
        operation: 'getUsersForStep',
        step: step.name,
        matchType: step.matchType,
        matchValue: step.matchValue,
        userCount: users.length,
        previousStepUserCount: previousStepUsers?.length,
        hasPreviousUsers: !!previousStepUsers,
      });

      return users;
    } catch (error) {
      timer.done({
        level: 'error',
        message: `Repository: Error getting users for step ${step.name}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get users who completed a specific step AND all previous steps (sequential requirement)
   * This ensures funnel steps are completed in order
   */
  async getUsersCompletingSequentialSteps(
    steps: FunnelStepConfig[],
    stepIndex: number,
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const timer = logger.startTimer();

    try {
      // Validate step index
      if (stepIndex < 0 || stepIndex >= steps.length) {
        throw new Error(`Invalid step index: ${stepIndex}`);
      }

      const firstStep = steps[0];
      if (!firstStep) {
        throw new Error('No steps provided');
      }

      // For step 0, just get all users for that step
      if (stepIndex === 0) {
        return await this.getUsersForStep(firstStep, startDate, endDate);
      }

      // For subsequent steps, we need users who completed ALL previous steps
      let usersAtCurrentStep = await this.getUsersForStep(
        firstStep,
        startDate,
        endDate
      );

      // Progressively filter users through each step
      for (let i = 1; i <= stepIndex; i++) {
        const currentStep = steps[i];
        if (!currentStep) {
          throw new Error(`Step at index ${i} is undefined`);
        }
        usersAtCurrentStep = await this.getUsersForStep(
          currentStep,
          startDate,
          endDate,
          usersAtCurrentStep
        );
      }

      const currentStepName = steps[stepIndex]?.name ?? 'unknown';

      timer.done({
        message: 'Repository: getUsersCompletingSequentialSteps completed',
        operation: 'getUsersCompletingSequentialSteps',
        stepIndex,
        stepName: currentStepName,
        userCount: usersAtCurrentStep.length,
      });

      return usersAtCurrentStep;
    } catch (error) {
      timer.done({
        level: 'error',
        message: `Repository: Error getting sequential step users for step ${stepIndex}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Build MongoDB query from filters
   * Always includes platform: 'web' filter
   */
  private buildQuery(filters: EventQueryFilters): Filter<EventDocument> {
    const query: Filter<EventDocument> = {
      platform: 'web', // Always filter for web platform
    };

    if (filters.user_id) {
      query.user_id = filters.user_id;
    }

    if (filters.session_id) {
      query.session_id = filters.session_id;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.hostname) {
      query['content.hostname'] = filters.hostname;
    }

    if (filters.path) {
      query['content.path'] = filters.path;
    }

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    return query;
  }
}
