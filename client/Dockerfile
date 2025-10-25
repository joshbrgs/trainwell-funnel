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

# Copy client package files
WORKDIR /app/client
COPY client/package*.json ./

# Install client dependencies (includes shared package)
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the client application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
