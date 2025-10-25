# MongoDB Connection Fix

## The Problem

You were getting this error:
```
/Users/josh/projects/trainwell-funnel/server/src/lib/mongo-client.ts:45
      throw new Error('Database not connected. Call connect() first.');
```

## Root Cause

The issue was a **timing/initialization order problem**:

```
1. Routes are loaded (app.ts imports routes)
   ↓
2. Controllers are instantiated (routes import controllers)
   ↓
3. Services are instantiated (controllers create services)
   ↓
4. Repositories are instantiated (services create repositories)
   ↓
5. Repository constructor calls mongoClient.getDb() ❌
   ↓
6. ERROR: Database not connected yet!
   ↓
7. server.ts finally calls mongoClient.connect() (too late!)
```

The repository was trying to access the database **in its constructor**, but the database connection wasn't established until **after** all the routes/controllers/services/repositories were already created.

## The Solution

Changed from **eager initialization** to **lazy loading** in the repository.

### Before (Broken)
```typescript
export class EventRepository {
  private collection: Collection<EventDocument>;

  constructor() {
    // ❌ Called immediately when repository is created (before DB connected)
    const db = mongoClient.getDb();
    this.collection = db.collection<EventDocument>('events');
  }

  async findById(id: string): Promise<EventDocument | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }
}
```

### After (Fixed)
```typescript
export class EventRepository {
  /**
   * Get the events collection
   * Lazy-loads the collection to avoid connection issues during initialization
   */
  private getCollection(): Collection<EventDocument> {
    // ✅ Called only when needed (after DB is connected)
    const db = mongoClient.getDb();
    return db.collection<EventDocument>('events');
  }

  async findById(id: string): Promise<EventDocument | null> {
    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  }
}
```

## Why This Works

**Lazy Loading** means we don't access the database until we actually need it:

```
1. Routes are loaded
   ↓
2. Controllers are instantiated
   ↓
3. Services are instantiated
   ↓
4. Repositories are instantiated ✅ (no DB access yet)
   ↓
5. server.ts calls mongoClient.connect() ✅
   ↓
6. User makes HTTP request
   ↓
7. Repository.findById() is called
   ↓
8. getCollection() is called (DB is now connected!) ✅
   ↓
9. Success! 🎉
```

## Changes Made

**File:** `server/src/repositories/event.repository.ts`

1. Removed the `collection` property
2. Added `getCollection()` method that returns the collection
3. Updated all methods to call `this.getCollection()` instead of `this.collection`

**Modified methods:**
- `findById()` - line 29
- `findMany()` - line 56
- `count()` - line 78

## Key Takeaway

When working with database connections in a layered architecture:

✅ **DO**: Use lazy loading (getter methods) for database access
❌ **DON'T**: Access the database in constructors

This ensures your application can initialize its layers without requiring an active database connection, and only connects when actually needed during request handling.
