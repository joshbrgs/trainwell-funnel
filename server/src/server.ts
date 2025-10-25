import { createApp } from '@/app';
import config from '@/config/config';
import mongoClient from '@/lib/mongo-client';
import logger from '@/lib/logger';
import { createDependencies } from '@/dependencies';

async function startServer() {
  try {
    // Connect to MongoDB first
    await mongoClient.connect();
    logger.info('MongoDB connected successfully');

    // Get database instance
    const db = mongoClient.getDb();

    // Initialize dependencies
    const dependencies = createDependencies(db);
    logger.info('Dependencies initialized');

    // Create Express app
    const app = createApp(dependencies);

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing MongoDB connection');
  await mongoClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing MongoDB connection');
  await mongoClient.disconnect();
  process.exit(0);
});

startServer();