import { EventRepository } from '@/repositories/event.repository';
import logger from '@/lib/logger';
import { EventModel, type EventQueryFilters } from '@/models/event.model';
import type { EventDTO, FunnelAnalysisRequest, FunnelStepResult } from '@trainwell-funnel/shared';

/**
 * Event Service - Business Logic Layer
 * Handles serialization/deserialization and business logic
 * Uses dependency injection for better testability
 */
export class EventService {
  private repository: EventRepository;

  /**
   * Constructor
   * @param repository - EventRepository instance (injected)
   */
  constructor(repository: EventRepository) {
    this.repository = repository;
  }

  /**
   * Get a single event by ID
   * Returns serialized DTO for API response
   */
  async getEventById(id: string): Promise<EventDTO | null> {
    try {
      logger.info(`Service: Getting event by ID: ${id}`);

      // Validate ID format
      if (!EventModel.isValidObjectId(id)) {
        logger.warn(`Service: Invalid ObjectId format: ${id}`);
        return null;
      }

      const event = await this.repository.findById(id);

      if (!event) {
        logger.info(`Service: Event not found: ${id}`);
        return null;
      }

      // Serialize to DTO using model
      const dto = EventModel.toDTO(event);
      logger.info(`Service: Successfully retrieved event: ${id}`);

      return dto;
    } catch (error) {
      logger.error(`Service: Error getting event by ID ${id}:`, error);
      throw new Error('Failed to retrieve event');
    }
  }

  /**
   * Get multiple events with filters
   */
  async getEvents(
    filters: EventQueryFilters,
    limit: number = 100,
    skip: number = 0
  ): Promise<{ events: EventDTO[]; total: number }> {
    try {
      logger.info('Service: Getting events with filters', { filters, limit, skip });

      const [events, total] = await Promise.all([
        this.repository.findMany(filters, limit, skip),
        this.repository.count(filters),
      ]);

      // Serialize all events to DTOs using model
      const dtos = EventModel.toDTOs(events);

      logger.info(`Service: Successfully retrieved ${events.length} of ${total} events`);

      return { events: dtos, total };
    } catch (error) {
      logger.error('Service: Error getting events:', error);
      throw new Error('Failed to retrieve events');
    }
  }

  /**
   * Analyze funnel conversion through configured steps
   * Returns step-by-step user counts and conversion metrics
   */
  async analyzeFunnel(request: FunnelAnalysisRequest): Promise<{
    steps: FunnelStepResult[];
    summary: {
      totalUsers: number;
      completedUsers: number;
      overallConversionRate: number;
      avgStepConversionRate: number;
    };
  }> {
    const { steps, startDate, endDate } = request;

    if (steps.length === 0) {
      throw new Error('At least one funnel step is required');
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new Error('Invalid date format');
    }

    logger.info('Service: Starting funnel analysis', {
      stepCount: steps.length,
      startDate,
      endDate,
    });

    // Get users for each step sequentially
    const stepResults: FunnelStepResult[] = [];
    let previousUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const users = await this.repository.getUsersCompletingSequentialSteps(
        steps,
        i,
        startDateTime,
        endDateTime
      );

      const userCount = users.length;
      const totalUsers = i === 0 ? userCount : stepResults[0]?.users ?? 0;

      const conversionRate = totalUsers > 0 ? (userCount / totalUsers) * 100 : 0;
      const stepConversionRate =
        i === 0 || previousUsers === 0 ? 100 : (userCount / previousUsers) * 100;
      const dropoffRate = 100 - stepConversionRate;

      stepResults.push({
        step: steps[i]?.name ?? 'Unknown',
        stepIndex: i,
        users: userCount,
        conversionRate,
        dropoffRate: i === 0 ? 0 : dropoffRate,
        stepConversionRate,
      });

      previousUsers = userCount;
    }

    // Calculate summary statistics
    const totalUsers = stepResults[0]?.users ?? 0;
    const completedUsers = stepResults[stepResults.length - 1]?.users ?? 0;
    const overallConversionRate =
      totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

    // Calculate average step conversion rate (excluding first step which is always 100%)
    const stepConversionRates = stepResults
      .slice(1)
      .map((s) => s.stepConversionRate);
    const avgStepConversionRate =
      stepConversionRates.length > 0
        ? stepConversionRates.reduce((a, b) => a + b, 0) / stepConversionRates.length
        : 100;

    logger.info('Service: Funnel analysis completed', {
      totalUsers,
      completedUsers,
      overallConversionRate,
      avgStepConversionRate,
    });

    return {
      steps: stepResults,
      summary: {
        totalUsers,
        completedUsers,
        overallConversionRate,
        avgStepConversionRate,
      },
    };
  }
}
