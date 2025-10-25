# Trainwell Funnel Analysis

A production-ready funnel analytics platform that visualizes user journey through conversion funnels, similar to Mixpanel or PostHog. Built as a growth engineering take-home project with full-stack TypeScript, containerized deployment, and real-time MongoDB analytics.

## Quick Start

### Prerequisites

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **MongoDB Database** - Atlas cluster or self-hosted instance with read access

### Running Locally

1. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your MongoDB credentials:
   ```env
   MONGO_HOST=your-cluster.mongodb.net
   MONGO_USER=your-username
   MONGO_PWD=your-password
   ```

2. **Start the Application**
   ```bash
   docker compose up -d
   ```

3. **Access the Application**
   - **Dashboard UI**: http://localhost:5173
   - **API Server**: http://localhost:8000
   - **Health Check**: http://localhost:8000/health

### Using Pre-built Docker Images

Pre-built images are automatically published to GitHub Container Registry on every push to `main`:

```bash
# Pull latest images
docker pull ghcr.io/OWNER/REPO/server:latest
docker pull ghcr.io/OWNER/REPO/client:latest

# Or use in docker-compose.yml
services:
  server:
    image: ghcr.io/OWNER/REPO/server:latest
  client:
    image: ghcr.io/OWNER/REPO/client:latest
```

**Available tags:**
- `latest` - Latest stable build from main branch
- `v1.0.0` - Semantic version tags
- `main-abc123` - Commit SHA tags for specific builds

**Workflows:**
- [`.github/workflows/publish-server.yml`](.github/workflows/publish-server.yml) - Publishes server image
- [`.github/workflows/publish-client.yml`](.github/workflows/publish-client.yml) - Publishes client image

## Technology Stack

### Frontend
- **React 19** + **TypeScript** + **Vite** - Modern React with fast HMR
- **TanStack Query (React Query)** - Server state management with caching
- **shadcn/ui** + **Tailwind CSS** - Beautiful, accessible component library
- **Recharts** - Responsive charting library for funnel visualizations
- **date-fns** - Date manipulation and formatting

### Backend
- **Express 5** + **TypeScript** - Type-safe REST API
- **MongoDB** + **Native Driver** - Document database with aggregation pipelines
- **Winston** + **Morgan** - Structured logging with HTTP request tracking
- **Vitest** - Fast unit testing with ES modules support

### DevOps
- **Docker** + **Docker Compose** - Containerized multi-service deployment
- **Nginx** - Production-grade static file serving for React app
- **Multi-stage Builds** - Optimized Docker images with build caching

### Shared
- **TypeScript Monorepo** - Shared types package for end-to-end type safety

## Architecture Overview

### Separation of Concerns

The application follows a clean **client-server architecture** with strict separation of concerns:

```
trainwell-funnel/
├── client/          # React dashboard (port 5173)
├── server/          # Express API (port 8000)
└── shared/          # Shared TypeScript types
```

**Benefits:**
- Independent deployment and scaling of frontend/backend
- Clear API contract via shared types
- Easy to add microservices (e.g., analytics worker, notification service)

### Shared Types Library

A dedicated `shared/` package provides **end-to-end type safety** across the stack:
- Prevents client-server contract drift
- Single source of truth for data models
- Similar to Protocol Buffers for gRPC, but for TypeScript

**Example:**
```typescript
// shared/src/types/funnel.types.ts
export interface FunnelAnalysisRequest {
  steps: FunnelStepConfig[];
  startDate: string;
  endDate: string;
}

// Used in both client and server with full IntelliSense
```

### Docker Containerization

Multi-stage Docker builds for **production-optimized images**:
- Builder stage: Compiles TypeScript, builds shared library
- Production stage: Minimal runtime with only production dependencies
- Shared library properly linked using file: protocol in package.json

For detailed architecture:
- **[Client Architecture](./client/README.md)** - React app, state management, components
- **[Server Architecture](./server/README.md)** - Layered architecture, DI, repositories

## Features

### ✅ Current Features

- **Sequential Funnel Analysis** - Track user progression through multi-step funnels
- **Interactive Dashboard** - Configure funnel steps with hostname or path matching
- **Date Range Filtering** - Analyze funnels across custom time periods
- **Real-time Metrics** - Total users, completed users, overall conversion rate
- **Step-by-Step Visualization** - Bar chart showing drop-off at each funnel step
- **Smart Input Handling** - Debounced queries (1s delay), whitespace trimming
- **Performance Optimized** - Aggregation pipelines optimized for read-only MongoDB
- **UTM Campaign Tracking** - Backend API ready for campaign effectiveness analysis
- **Comprehensive Logging** - Winston + Morgan for structured HTTP and application logs
- **Unit Tests** - Vitest test suite for repositories and services

### 🚀 Future Enhancements

**Campaign Analysis Dashboard** (~2-3 hours)
- UTM source/medium/campaign effectiveness metrics
- First page view attribution tracking
- Campaign comparison visualizations
- Already built: Backend API + MongoDB queries

**Performance Improvements**
- Redis/Valkey caching layer for frequently-accessed funnels
- Query result memoization with TTL
- Materialized views for common date ranges

**Advanced Visualizations**
- Sankey diagrams for campaign flow visualization
- Cohort retention tables
- Time-series trend analysis
- A/B test funnel comparisons

**Scalability**
- Horizontal scaling with load balancer
- Read replicas for MongoDB
- Event streaming with Kafka for real-time updates

## Development Notes

### ES Module Import Resolution

**Challenge:** TypeScript with ES modules (`"type": "module"`) requires explicit `.js` extensions in imports, but TypeScript doesn't add them during compilation.

**Solution:** Custom post-build script (`fix-imports.js`) that:
1. Adds `.js` extensions to all relative imports
2. Converts directory imports (e.g., `./routes/v1`) to `./routes/v1/index.js`
3. Runs automatically after `tsc` and `tsc-alias`

**Example:**
```javascript
// Before fix-imports.js
import { createApp } from './app';
import { createV1Routes } from './routes/v1';

// After fix-imports.js
import { createApp } from './app.js';
import { createV1Routes } from './routes/v1/index.js';
```

This ensures Node.js can resolve all imports correctly in production.

### MongoDB Performance Optimization

With **read-only database access**, we optimized queries to leverage existing indexes:

**Existing Indexes:**
- `user_id_1_date_1` - For user-based filtering with date ranges
- `user_id_1_content.hostname_1_content.path_1` - For path/hostname matching

**Optimization Strategy:**
- Use aggregation pipelines instead of `distinct()`
- Reorder `$match` conditions to prioritize indexed fields
- Filter by `user_id` first (when available), then `date`, then `path`/`hostname`

**Performance Impact:**
- Sequential funnel steps: **80-95% faster** (5s → 100-500ms)
- Overall funnel queries: **20-50% faster**

See [server/docs/QUERY_OPTIMIZATION.md](./server/docs/QUERY_OPTIMIZATION.md) for details.

## Project Structure

```
trainwell-funnel/
├── client/                    # React Dashboard
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # React Query hooks
│   │   ├── pages/             # Dashboard page
│   │   └── lib/               # Utilities
│   ├── Dockerfile             # Multi-stage build
│   └── nginx.conf             # Production web server config
├── server/                    # Express API
│   ├── src/
│   │   ├── controllers/       # HTTP request handlers
│   │   ├── services/          # Business logic layer
│   │   ├── repositories/      # Data access layer
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Express middleware
│   │   └── lib/               # MongoDB client, logger
│   ├── scripts/               # Build utilities
│   ├── tests/                 # Vitest unit tests
│   └── Dockerfile             # Multi-stage build
├── shared/                    # Shared TypeScript types
│   └── src/types/             # Type definitions
└── compose.yml                # Docker Compose orchestration
```

## API Documentation

### Funnel Analysis
```http
POST /api/v1/funnel/analyze
Content-Type: application/json

{
  "steps": [
    { "name": "Homepage", "matchType": "hostname", "matchValue": "www.trainwell.net" },
    { "name": "Pricing", "matchType": "path", "matchValue": "/pricing" }
  ],
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.999Z"
}
```

### Campaign Analysis (Backend Ready)
```http
POST /api/v1/campaigns/analyze
GET /api/v1/campaigns/first-view-insights?startDate=...&endDate=...
```

## Testing

### Local Testing

```bash
# Run unit tests
cd server
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### CI/CD Testing

GitHub Actions automatically runs the test suite on every push and pull request:

- **Workflow**: [`.github/workflows/test.yml`](.github/workflows/test.yml)
- **Test Coverage**: Generated and uploaded as build artifacts
- **Dependencies**: Cached for faster builds

View test results in the [Actions tab](../../actions) of this repository.

## Contributing

This is a take-home project, but demonstrates production-ready patterns:
- Dependency injection for testability
- Layered architecture (routes → controllers → services → repositories)
- Comprehensive error handling and logging
- Type-safe API contracts
- Performance-optimized MongoDB queries