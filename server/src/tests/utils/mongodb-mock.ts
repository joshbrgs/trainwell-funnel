import { vi } from 'vitest';
import type { Collection, Db, AggregationCursor, FindCursor } from 'mongodb';

/**
 * Create a mock MongoDB collection for testing
 * Provides chainable methods for find, aggregate, etc.
 */
export function createMockCollection<T>(): Collection<T> {
  const mockToArray = vi.fn().mockResolvedValue([]);
  const mockLimit = vi.fn().mockReturnThis();
  const mockSkip = vi.fn().mockReturnThis();
  const mockSort = vi.fn().mockReturnThis();

  const mockFindCursor = {
    toArray: mockToArray,
    limit: mockLimit,
    skip: mockSkip,
    sort: mockSort,
  } as unknown as FindCursor<T>;

  const mockAggregateCursor = {
    toArray: mockToArray,
    explain: vi.fn().mockResolvedValue({}),
  } as unknown as AggregationCursor<T>;

  return {
    findOne: vi.fn(),
    find: vi.fn().mockReturnValue(mockFindCursor),
    insertOne: vi.fn(),
    insertMany: vi.fn(),
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    countDocuments: vi.fn(),
    distinct: vi.fn(),
    aggregate: vi.fn().mockReturnValue(mockAggregateCursor),
  } as unknown as Collection<T>;
}

/**
 * Create a mock MongoDB database for testing
 * Returns the same collection instance for consistent mocking
 */
export function createMockDb(): { db: Db; collection: Collection<any> } {
  const mockCollection = createMockCollection();

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  } as unknown as Db;

  return { db: mockDb, collection: mockCollection };
}

/**
 * Helper to extract mock functions from collection
 */
export function getMockCollectionMethods<T>(collection: Collection<T>) {
  return {
    findOne: collection.findOne as ReturnType<typeof vi.fn>,
    find: collection.find as ReturnType<typeof vi.fn>,
    insertOne: collection.insertOne as ReturnType<typeof vi.fn>,
    updateOne: collection.updateOne as ReturnType<typeof vi.fn>,
    deleteOne: collection.deleteOne as ReturnType<typeof vi.fn>,
    countDocuments: collection.countDocuments as ReturnType<typeof vi.fn>,
    distinct: collection.distinct as ReturnType<typeof vi.fn>,
    aggregate: collection.aggregate as ReturnType<typeof vi.fn>,
  };
}
