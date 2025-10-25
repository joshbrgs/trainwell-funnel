import { Router } from 'express';
import type { EventController } from '@/controllers/event.controller';

/**
 * Event Routes Factory - v1
 * Creates routes for event-related endpoints with injected dependencies
 * @param eventController - Injected EventController instance
 */
export function createEventRoutes(eventController: EventController): Router {
  const router = Router();

  /**
   * @route   POST /api/v1/events/funnel
   * @desc    Analyze funnel with configured steps and date range
   * @body    { steps: FunnelStepConfig[], startDate: string, endDate: string }
   * @access  Public
   */
  router.post('/funnel', eventController.analyzeFunnel);

  /**
   * @route   GET /api/v1/events/:id
   * @desc    Get a single event by ID (web platform only)
   * @access  Public
   */
  router.get('/:id', eventController.getEventById);

  /**
   * @route   GET /api/v1/events
   * @desc    Get events with optional filters (web platform only)
   * @query   user_id, session_id, type, hostname, path, startDate, endDate, limit, skip
   * @access  Public
   */
  router.get('/', eventController.getEvents);

  return router;
}
