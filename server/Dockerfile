# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy shared package first
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src

# Build shared package
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy server package files
WORKDIR /app/server
COPY server/package*.json ./

# Install server dependencies (includes shared package)
RUN npm ci

# Copy server source code
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/scripts ./scripts

# Build the server application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy and prepare shared package for production
COPY shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
WORKDIR /app/shared
RUN npm ci --omit=dev

# Copy server package files and install dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy built server application from builder stage
COPY --from=builder /app/server/dist ./dist

# Expose the port the app runs on
EXPOSE 8000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server.js"]
