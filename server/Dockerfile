# ==============================================================================
# Multi-Stage Production Dockerfile for NextEra Coders Backend Server
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm ci

# Copy TypeScript source and configurations
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled code from build stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security compliance
USER node

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]
