# ============================================================================
# APEX SNIPER - Dockerfile
# Multi-stage build for optimized production image
# ============================================================================

# Stage 1: Build the backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Build the dashboard
FROM node:20-alpine AS dashboard-builder

WORKDIR /app/dashboard

COPY src/dashboard/package*.json ./
RUN npm ci

COPY src/dashboard ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built backend
COPY --from=backend-builder /app/dist ./dist

# Copy built dashboard
COPY --from=dashboard-builder /app/dashboard/dist ./dashboard-dist

# Copy environment example
COPY .env.example ./.env.example

# Create directories
RUN mkdir -p logs

# Set environment
ENV NODE_ENV=production
ENV API_PORT=3001
ENV DASHBOARD_PORT=3000

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
