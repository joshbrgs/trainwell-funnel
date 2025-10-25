import { Db } from 'mongodb';
import { EventRepository } from '@/repositories/event.repository';
import { EventService } from '@/services/event.service';
import { EventController } from '@/controllers/event.controller';
import { CampaignRepository } from '@/repositories/campaign.repository';
import { CampaignService } from '@/services/campaign.service';
import { CampaignController } from '@/controllers/campaign.controller';

/**
 * Dependency Container
 * Initializes and wires up all application dependencies
 */
export class DependencyContainer {
  public eventController: EventController;
  public campaignController: CampaignController;

  /**
   * Initialize all dependencies with proper injection
   * @param db - MongoDB database instance
   */
  constructor(db: Db) {
    // Initialize event dependencies
    const eventRepository = new EventRepository(db);
    const eventService = new EventService(eventRepository);
    this.eventController = new EventController(eventService);

    // Initialize campaign dependencies
    const campaignRepository = new CampaignRepository(db);
    const campaignService = new CampaignService(campaignRepository);
    this.campaignController = new CampaignController(campaignService);
  }
}

/**
 * Factory function to create dependency container
 * @param db - MongoDB database instance
 */
export function createDependencies(db: Db): DependencyContainer {
  return new DependencyContainer(db);
}
