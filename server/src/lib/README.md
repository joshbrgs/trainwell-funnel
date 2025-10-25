# MongoDB Client Usage

The MongoDB client is a singleton that provides a reusable connection to the MongoDB database.

## Basic Usage

```typescript
import mongoClient from '@/lib/mongo-client';

// The connection is automatically established when the server starts

// Get the database instance
const db = mongoClient.getDb();

// Access collections
const eventsCollection = db.collection('events');

// Query data
const events = await eventsCollection.find({
  platform: 'web',
  type: 'page_view'
}).toArray();

// Find a specific event
const event = await eventsCollection.findOne({
  user_id: 'some-user-id'
});
```

## Example: Events Service

```typescript
import mongoClient from '@/lib/mongo-client';

export class EventsService {
  async getEventsByUser(userId: string) {
    const db = mongoClient.getDb();
    const events = db.collection('events');

    return await events.find({
      user_id: userId,
      platform: 'web',
      type: 'page_view'
    }).toArray();
  }

  async getEventsByDateRange(startDate: Date, endDate: Date) {
    const db = mongoClient.getDb();
    const events = db.collection('events');

    return await events.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      },
      platform: 'web',
      type: 'page_view'
    }).toArray();
  }
}
```

## Features

- **Singleton Pattern**: Only one connection is created and reused throughout the application
- **Auto-connect**: Connection is established when the server starts
- **Graceful Shutdown**: Connection is properly closed when the server shuts down
- **Error Handling**: Errors are logged using the winston logger
- **Type Safety**: Full TypeScript support with MongoDB types
