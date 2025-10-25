# @trainwell-funnel/shared

Shared TypeScript types and utilities for the Trainwell Funnel project. This package provides a **single source of truth** for data contracts between the client and server, ensuring type safety across the entire application stack.

## Purpose

This package eliminates type duplication and API contract mismatches by centralizing all shared types in one location. Similar to Protocol Buffers or OpenAPI spec generation, this approach prevents runtime errors caused by type inconsistencies between frontend and backend.

**Key Benefits:**
- **Type Safety** - Compile-time guarantees that client and server speak the same language
- **DRY Principle** - Define types once, use everywhere
- **Refactoring Confidence** - Change a type and TypeScript catches all breaking changes
- **API Documentation** - Types serve as living documentation of API contracts

## What's Inside

### Event Types (`src/types/event.types.ts`)
Core data structures for tracking user events:
- `EventDTO` - Complete event object with all fields
- `PageViewContent` - Page view event payload
- `UTMParameters` - Campaign tracking parameters
- `EventType` - Event type enumeration (page_view, etc.)
- `Platform` - Platform enumeration (web, ios, android)

### Funnel Analysis Types (`src/types/funnel.types.ts`)
Request/response contracts for funnel analysis:
- `FunnelStepConfig` - Single funnel step configuration
- `FunnelAnalysisRequest` - API request payload
- `FunnelAnalysisResponse` - API response payload
- `FunnelStepResult` - Individual step metrics

### Campaign Analysis Types (`src/types/campaign.types.ts`)
UTM campaign tracking and analysis:
- `CampaignAnalysisRequest` - Campaign metrics request
- `CampaignAnalysisResponse` - Campaign metrics response
- `CampaignMetrics` - Individual campaign performance data
- `FirstViewInsightsRequest` - First page view analysis request
- `FirstViewInsightsResponse` - First page view analysis response

## Installation

This is a **local monorepo package** referenced via the `file:` protocol. Both client and server depend on it through their package.json:

```json
{
  "dependencies": {
    "@trainwell-funnel/shared": "file:../shared"
  }
}
```

**Development Workflow:**
1. Make changes to types in `shared/src/types/`
2. Build the package: `npm run build`
3. Changes automatically available in client and server (no npm install needed)

## Usage

### Basic Import

```typescript
import type {
  EventDTO,
  FunnelAnalysisRequest,
  FunnelAnalysisResponse,
  CampaignMetrics
} from '@trainwell-funnel/shared';
```

### Server-Side Example

```typescript
// server/src/controllers/funnel.controller.ts
import type { FunnelAnalysisRequest, FunnelAnalysisResponse } from '@trainwell-funnel/shared';
import { Request, Response } from 'express';

export class FunnelController {
  async analyzeFunnel(req: Request, res: Response): Promise<void> {
    // TypeScript knows the exact shape of the request body
    const request: FunnelAnalysisRequest = req.body;

    // Business logic...
    const response: FunnelAnalysisResponse = await this.service.analyze(request);

    // Response is fully typed
    res.json(response);
  }
}
```

### Client-Side Example

```typescript
// client/src/hooks/use-events.ts
import { useMutation } from '@tanstack/react-query';
import type { FunnelAnalysisRequest, FunnelAnalysisResponse } from '@trainwell-funnel/shared';

export function useFunnelAnalysis() {
  return useMutation({
    mutationFn: async (request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse> => {
      const response = await fetch('/api/v1/funnel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Analysis failed');

      // TypeScript guarantees the response shape
      return response.json();
    },
  });
}
```

### Type-Safe Event Creation

```typescript
import type { EventDTO, PageViewContent } from '@trainwell-funnel/shared';

// TypeScript enforces all required fields
const event: EventDTO = {
  id: '123',
  user_id: 'user_456',
  platform: 'web',
  type: 'page_view',
  date: '2025-10-24T12:00:00Z',
  content: {
    path: '/signup',
    hostname: 'app.trainwell.net',
    first_view: true,
    utm: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'fall_sale',
    },
  },
};

// Missing fields cause compile errors ✅
// const invalidEvent: EventDTO = { id: '123' }; // Error!
```

## Development

### Build the Package

```bash
npm run build
```

Outputs compiled JavaScript and type declarations to `dist/`:
- `dist/index.js` - Compiled JavaScript (ES modules)
- `dist/index.d.ts` - TypeScript declarations
- Source maps for debugging

### Watch Mode

```bash
npm run watch
```

Automatically rebuilds on file changes. Useful when actively developing types alongside client/server code.

### Adding New Types

1. **Create Type File**
   ```bash
   # Example: Add new analytics types
   touch src/types/analytics.types.ts
   ```

2. **Define Types**
   ```typescript
   // src/types/analytics.types.ts
   export interface AnalyticsEvent {
     eventName: string;
     timestamp: string;
     properties: Record<string, any>;
   }

   export interface AnalyticsRequest {
     events: AnalyticsEvent[];
     sessionId: string;
   }
   ```

3. **Export from Index**
   ```typescript
   // src/index.ts
   export type {
     AnalyticsEvent,
     AnalyticsRequest,
   } from './types/analytics.types.js';
   ```

4. **Build Package**
   ```bash
   npm run build
   ```

5. **Use in Client/Server**
   ```typescript
   import type { AnalyticsEvent } from '@trainwell-funnel/shared';
   // Types automatically available - no npm install needed!
   ```

## Type Organization Guidelines

### ✅ Do Include

**Data Transfer Objects (DTOs)**
- Request payloads
- Response payloads
- Event structures
- API contracts

**Shared Enums and Constants**
```typescript
export type Platform = 'web' | 'ios' | 'android';
export type EventType = 'page_view' | 'button_click' | 'form_submit';
```

**Pure Data Structures**
```typescript
export interface FunnelStepConfig {
  name: string;
  matchType: 'hostname' | 'path';
  matchValue: string;
}
```

**Utility Types**
```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
```

### ❌ Do Not Include

**Database-Specific Types**
```typescript
// ❌ Don't include MongoDB ObjectId or Date types
import { ObjectId } from 'mongodb';

// ✅ Use serialized string representations instead
export interface EventDTO {
  id: string;  // Not ObjectId
  date: string;  // ISO 8601 string, not Date object
}
```

**Framework-Specific Types**
```typescript
// ❌ Don't reference React or Express types
import { ReactNode } from 'react';
import { Request } from 'express';

// ✅ Keep types framework-agnostic
```

**Business Logic**
```typescript
// ❌ Don't include implementation logic
export function calculateConversionRate(total: number, converted: number) {
  return (converted / total) * 100;
}

// ✅ Only type definitions
export interface ConversionMetrics {
  totalUsers: number;
  convertedUsers: number;
  conversionRate: number;
}
```

**Implementation Details**
```typescript
// ❌ Don't include specific implementations
export class FunnelAnalyzer { /* ... */ }

// ✅ Only interfaces and types
export interface IFunnelAnalyzer {
  analyze(request: FunnelAnalysisRequest): Promise<FunnelAnalysisResponse>;
}
```

## Type Safety Standards

All types in this package follow strict TypeScript practices:

### No `any` Types
```typescript
// ❌ Avoid
export interface Config {
  options: any;
}

// ✅ Use specific types or unknown
export interface Config {
  options: Record<string, string | number | boolean>;
}
```

### Proper Null Handling
```typescript
// ✅ Explicit optional and nullable types
export interface UTMParameters {
  utm_source?: string | null;  // May be undefined or null
  utm_medium?: string | null;
  utm_campaign?: string | null;
}
```

### Clear Documentation
```typescript
/**
 * Configuration for a single step in a funnel analysis.
 *
 * @property name - Human-readable step name (e.g., "Landing Page")
 * @property matchType - How to match events: "hostname" or "path"
 * @property matchValue - The value to match against (e.g., "/signup")
 *
 * @example
 * {
 *   name: "Signup Page",
 *   matchType: "path",
 *   matchValue: "/signup"
 * }
 */
export interface FunnelStepConfig {
  name: string;
  matchType: 'hostname' | 'path';
  matchValue: string;
}
```

### Strict TypeScript Configuration

See [tsconfig.json](tsconfig.json) for compiler settings:
- `strict: true` - All strict checks enabled
- `noUncheckedIndexedAccess: true` - Index signatures return `T | undefined`
- `exactOptionalPropertyTypes: true` - `?` means `T | undefined`, not `T | undefined | null`

## Project Structure

```
shared/
├── src/
│   ├── types/
│   │   ├── event.types.ts       # Event DTOs and enums
│   │   ├── funnel.types.ts      # Funnel analysis contracts
│   │   └── campaign.types.ts    # Campaign analysis contracts
│   └── index.ts                 # Main export file
├── dist/                        # Compiled output (gitignored)
│   ├── index.js
│   ├── index.d.ts
│   └── types/
├── tsconfig.json                # TypeScript configuration
└── package.json
```

## Docker Build Support

The shared package is built during Docker containerization:

```dockerfile
# Build shared package first
WORKDIR /app/shared
COPY shared/package*.json shared/tsconfig.json ./
COPY shared/src ./src
RUN npm ci && npm run build

# Then build server/client with shared package available
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci  # Installs @trainwell-funnel/shared from ../shared
```

This ensures the shared types are always up-to-date in production builds.

## Version Management

Since this is a local file reference, versioning happens at the git repository level:

- **No npm publish** - Package is not published to npm
- **Git commits** - Track changes via git history
- **No semver** - Version changes tracked by repository version

**Benefits:**
- Instant changes without publish/install cycle
- Guaranteed consistency (same commit = same types)
- Simplified dependency management

## Testing

While this package contains only types (no runtime code), you can validate type correctness:

```bash
# Type-check the package
npm run build

# If it compiles without errors, types are valid
```

For comprehensive testing, use the types in client/server tests:

```typescript
// server/src/tests/controllers/funnel.test.ts
import type { FunnelAnalysisRequest } from '@trainwell-funnel/shared';

const mockRequest: FunnelAnalysisRequest = {
  steps: [{ name: 'Test', matchType: 'path', matchValue: '/' }],
  startDate: '2025-10-01T00:00:00Z',
  endDate: '2025-10-24T23:59:59Z',
};

// TypeScript enforces the correct shape
```

## Common Patterns

### Extending Types

```typescript
// Extend base types for specific use cases
import type { EventDTO } from '@trainwell-funnel/shared';

// Add computed fields for frontend display
interface EventWithMetadata extends EventDTO {
  formattedDate: string;
  isRecent: boolean;
}
```

### Type Guards

```typescript
import type { EventType } from '@trainwell-funnel/shared';

export function isPageView(type: EventType): type is 'page_view' {
  return type === 'page_view';
}
```

### Utility Types

```typescript
// Make all fields optional (for partial updates)
import type { FunnelStepConfig } from '@trainwell-funnel/shared';

type PartialStepConfig = Partial<FunnelStepConfig>;

// Pick specific fields
type StepIdentifier = Pick<FunnelStepConfig, 'name' | 'matchType'>;
```

## Migration Guide

### From Duplicated Types

**Before:**
```typescript
// server/src/types.ts
export interface FunnelRequest { /* ... */ }

// client/src/types.ts
export interface FunnelRequest { /* ... */ }  // Duplicate!
```

**After:**
```typescript
// shared/src/types/funnel.types.ts
export interface FunnelAnalysisRequest { /* ... */ }

// Both client and server import the same type
import type { FunnelAnalysisRequest } from '@trainwell-funnel/shared';
```

### From JavaScript to TypeScript

If migrating from untyped JavaScript:

1. Start with basic types
2. Gradually add more specific constraints
3. Use TypeScript's inference where possible
4. Avoid `any` - use `unknown` for truly unknown data

## Contributing

When adding or modifying types:

1. **Discuss API changes** - Types represent contracts; changes affect both client and server
2. **Update all usages** - TypeScript will show errors if types change
3. **Document complex types** - Add JSDoc comments for clarity
4. **Follow naming conventions**:
   - Interfaces: `PascalCase` (e.g., `FunnelStepConfig`)
   - Type aliases: `PascalCase` (e.g., `Platform`)
   - Request types: `*Request` suffix
   - Response types: `*Response` suffix
   - DTOs: `*DTO` suffix
