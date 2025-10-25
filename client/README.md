# Trainwell Funnel Dashboard

A modern React dashboard for funnel analytics, built with TypeScript and Vite. Features a polished UI powered by shadcn/ui and Tailwind CSS, with efficient server state management via TanStack Query.

## Quick Start

### Prerequisites
- **Node.js 22+** and **npm**

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your API server URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the dashboard at http://localhost:5173 with hot module reloading (HMR) powered by Vite and SWC.

### Production Build

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview production build locally
```

## Architecture

### Component Organization

The project follows shadcn/ui's **component composition pattern**:

```
src/
├── components/
│   ├── ui/                    # Primitive shadcn/ui components
│   │   ├── button.tsx         # Base Button component
│   │   ├── card.tsx           # Card container component
│   │   └── ...                # Other UI primitives
│   ├── date-range-picker.tsx  # Composed date picker
│   ├── funnel-step-builder.tsx# Funnel configuration form
│   └── funnel-visualization.tsx# Recharts bar chart
├── pages/
│   └── dashboard.tsx          # Main dashboard page (global state)
├── hooks/
│   └── use-events.ts          # TanStack Query hooks
└── lib/
    ├── api-client.ts          # Fetch wrapper with error handling
    └── utils.ts               # Utility functions (cn, etc.)
```

**Design Principles:**
- **UI Components** (`components/ui/`) - Primitive, reusable, stateless
- **Feature Components** (`components/`) - Composed from UI primitives, manage local state
- **Pages** (`pages/`) - Top-level views, manage global state for the page
- **Future:** Introduce React Context for cross-component state when adding multiple pages

### State Management

**TanStack Query (React Query)** handles all server state:

```typescript
// hooks/use-events.ts
export function useFunnelAnalysis() {
  return useMutation({
    mutationFn: (request: FunnelAnalysisRequest) =>
      apiClient.post('/funnel/analyze', request),
    // Automatic caching, revalidation, error handling
  })
}

// pages/dashboard.tsx
const { mutate: analyzeFunnel, data } = useFunnelAnalysis()
```

**Benefits:**
- Automatic request deduplication
- Client-side caching with TTL
- Optimistic updates
- Background refetching
- Loading/error states out of the box

**API Client Abstraction** (`lib/api-client.ts`):
- Centralized base URL configuration
- Automatic JSON parsing
- Error handling and logging
- Typed request/response with shared types

### Performance Optimizations

1. **Debounced Queries** - 1-second delay before querying on input changes
2. **Input Validation** - Skip queries if funnel steps are incomplete
3. **React Query Caching** - Avoid redundant API calls for identical requests
4. **Code Splitting** - Vite automatically splits routes and components

## Technology Stack

- **React 19** - Latest React with concurrent rendering
- **TypeScript** - Full type safety with shared types package
- **Vite** - Next-generation build tool with instant HMR
- **TanStack Query v5** - Powerful async state management
- **shadcn/ui** - Radix UI primitives with Tailwind styling
- **Tailwind CSS v4** - Utility-first styling with JIT compiler
- **Recharts** - Declarative charting library for funnel visualization
- **date-fns** - Lightweight date manipulation
- **Lucide React** - Beautiful icon library

## Production Deployment

### Docker Containerization

The client uses a **multi-stage Docker build**:

**Stage 1: Builder**
- Builds shared types package
- Installs client dependencies
- Compiles TypeScript and bundles with Vite
- Outputs optimized static files to `dist/`

**Stage 2: Production**
- Nginx Alpine (minimal footprint)
- Serves static files from `dist/`
- Custom nginx.conf for SPA routing

```dockerfile
# Dockerfile (simplified)
FROM node:22-alpine AS builder
WORKDIR /app
COPY shared/ ./shared/
RUN cd shared && npm ci && npm run build
COPY client/ ./client/
RUN cd client && npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
```

### Nginx Configuration

Handles **SPA routing** (fallback to `index.html` for client-side routes):

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Benefits:**
- Serves static assets efficiently (gzip, caching headers)
- Separate from API server (can scale independently)
- CDN-friendly (all assets are static files)

## Project Structure

```
client/
├── public/              # Static assets (served as-is)
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui primitives
│   │   ├── date-range-picker.tsx
│   │   ├── funnel-step-builder.tsx
│   │   └── funnel-visualization.tsx
│   ├── hooks/
│   │   └── use-events.ts    # TanStack Query hooks
│   ├── lib/
│   │   ├── api-client.ts    # Fetch wrapper
│   │   └── utils.ts         # cn() and helpers
│   ├── pages/
│   │   └── dashboard.tsx    # Main dashboard page
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── Dockerfile
├── nginx.conf           # Production web server config
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Features

### Dashboard Components

**Funnel Step Builder**
- Add/remove funnel steps dynamically
- Configure match type (hostname or path)
- Real-time validation with error states
- Drag-to-reorder (future enhancement)

**Date Range Picker**
- Calendar UI with date presets (Last 7/30/90 days)
- Constrains future dates (can't analyze future events)
- Keyboard navigation support

**Funnel Visualization**
- Recharts bar chart with color-coded conversion rates
- Hover tooltips showing:
  - User count
  - Overall conversion rate (% of step 1)
  - Drop-off from previous step
- Responsive design (adapts to container width)

**Summary Metrics Cards**
- Total users (entered funnel)
- Completed users (finished all steps)
- Overall conversion rate (end-to-end %)

## Future Enhancements

### Routing
- **React Router** - Add client-side routing for:
  - Dashboard (`/`)
  - Campaign analysis (`/campaigns`)
  - Settings (`/settings`)

### Testing
- **Vitest** - Unit tests for components and hooks
- **React Testing Library** - Component integration tests
- **Playwright** - E2E tests for critical user flows

### Features
- **Saved Funnels** - Persist funnel configurations to database
- **Funnel Comparison** - Compare two funnels side-by-side
- **Export to CSV** - Download funnel data as spreadsheet
- **Dark Mode** - Tailwind dark mode support (already configured)

### Performance
- **Virtual Scrolling** - For large funnel step lists
- **Web Workers** - Offload heavy data transformations
- **Service Worker** - Offline support with cached data

## Development Tips

### Adding shadcn/ui Components

```bash
# Install a new component (e.g., Select dropdown)
npx shadcn@latest add select

# Components are added to src/components/ui/
# Customize as needed - you own the code
```

### Debugging React Query

Install the **React Query Devtools** (already configured):

```typescript
// main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Devtools show:
- Active queries and mutations
- Cache state and TTL
- Refetch/invalidation events

### Type Safety with Shared Package

The `@trainwell-funnel/shared` package ensures **client-server contract safety**:

```typescript
// Shared types are imported from the package
import type { FunnelAnalysisRequest, FunnelAnalysisResponse } from '@trainwell-funnel/shared'

// TypeScript enforces the exact API contract
const request: FunnelAnalysisRequest = {
  steps: [...],
  startDate: '...',
  endDate: '...',
}

// Response is fully typed
const response: FunnelAnalysisResponse = await apiClient.post('/funnel/analyze', request)
```

**No manual type duplication** - single source of truth for API contracts.

## Contributing

This client demonstrates modern React best practices:
- Component composition over prop drilling
- Server state with TanStack Query (not Redux)
- Atomic design with shadcn/ui primitives
- Type safety end-to-end
- Performance-first with Vite and code splitting