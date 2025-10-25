import type { Request, Response, NextFunction } from 'express';
import { EventService } from '@/services/event.service';
import logger from '@/lib/logger';
import type { EventQueryFilters } from '@/models/event.model';
import type { FunnelAnalysisRequest, FunnelAnalysisResponse } from '@trainwell-funnel/shared';

/**
 * Event Controller - HTTP Request/Response Handler
 * Handles all HTTP responses and request parsing
 * Uses dependency injection for better testability
 */
export class EventController {
  private service: EventService;

  /**
   * Constructor
   * @param service - EventService instance (injected)
   */
  constructor(service: EventService) {
    this.service = service;
  }

  /**
   * GET /api/v1/events/:id
   * Get a single event by ID
   */
  getEventById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Event ID is required',
        });
        return;
      }

      logger.http(`Controller: GET /api/v1/events/${id}`);

      const event = await this.service.getEventById(id);

      if (!event) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      logger.error('Controller: Error in getEventById:', error);
      next(error);
    }
  };

  /**
   * GET /api/v1/events
   * Get multiple events with optional filters
   */
  getEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.http('Controller: GET /api/v1/events', { query: req.query });

      // Parse query parameters
      const filters = this.parseFilters(req.query);
      const limit = this.parseNumber(req.query.limit, 100, 1, 1000);
      const skip = this.parseNumber(req.query.skip, 0, 0, Number.MAX_SAFE_INTEGER);

      const result = await this.service.getEvents(filters, limit, skip);

      res.status(200).json({
        success: true,
        data: result.events,
        pagination: {
          total: result.total,
          limit,
          skip,
          count: result.events.length,
        },
      });
    } catch (error) {
      logger.error('Controller: Error in getEvents:', error);
      next(error);
    }
  };

  /**
   * Parse query string filters into EventQueryFilters
   */
  private parseFilters(query: any): EventQueryFilters {
    const filters: EventQueryFilters = {};

    if (query.user_id && typeof query.user_id === 'string') {
      filters.user_id = query.user_id;
    }

    if (query.session_id && typeof query.session_id === 'string') {
      filters.session_id = query.session_id;
    }

    if (query.type && typeof query.type === 'string') {
      filters.type = query.type as 'page_view';
    }

    if (query.hostname && typeof query.hostname === 'string') {
      filters.hostname = query.hostname;
    }

    if (query.path && typeof query.path === 'string') {
      filters.path = query.path;
    }

    if (query.startDate && typeof query.startDate === 'string') {
      const date = new Date(query.startDate);
      if (!isNaN(date.getTime())) {
        filters.startDate = date;
      }
    }

    if (query.endDate && typeof query.endDate === 'string') {
      const date = new Date(query.endDate);
      if (!isNaN(date.getTime())) {
        filters.endDate = date;
      }
    }

    return filters;
  }

  /**
   * POST /api/v1/events/funnel
   * Analyze funnel with configured steps and date range
   */
  analyzeFunnel = async (
    req: Request,
    res: Response<FunnelAnalysisResponse>
  ): Promise<void> => {
    try {
      const body = req.body as FunnelAnalysisRequest;

      logger.http('Controller: POST /api/v1/events/funnel', {
        stepCount: body.steps?.length,
        startDate: body.startDate,
        endDate: body.endDate,
      });

      // Validation
      if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one funnel step is required',
        });
        return;
      }

      if (!body.startDate || !body.endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
        return;
      }

      // Validate each step
      for (const step of body.steps) {
        if (!step.name || !step.matchType || !step.matchValue) {
          res.status(400).json({
            success: false,
            error: 'Each step must have name, matchType, and matchValue',
          });
          return;
        }

        if (step.matchType !== 'path' && step.matchType !== 'hostname') {
          res.status(400).json({
            success: false,
            error: 'matchType must be either "path" or "hostname"',
          });
          return;
        }
      }

      const result = await this.service.analyzeFunnel(body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Controller: Error in analyzeFunnel:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };

  /**
   * Parse and validate numeric query parameters
   */
  private parseNumber(
    value: any,
    defaultValue: number,
    min: number,
    max: number
  ): number {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        return parsed;
      }
    }
    return defaultValue;
  }
}
