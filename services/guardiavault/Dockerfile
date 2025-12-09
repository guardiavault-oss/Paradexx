# Multi-stage build for GuardiaVault
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm (use specific version for consistency with lockfile)
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm for build stage (use specific version for consistency with lockfile)
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# Copy package files, lockfile, and pnpm config
COPY package.json pnpm-lock.yaml .npmrc ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install DNS and network utilities, CA certificates for HTTPS
# Alpine Linux needs these for proper DNS resolution and HTTPS connections
RUN apk add --no-cache \
    ca-certificates \
    curl \
    bind-tools \
    && update-ca-certificates

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 guardiavault

# Install pnpm for runner stage (use specific version for consistency with lockfile)
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml .npmrc ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder --chown=guardiavault:nodejs /app/dist ./dist
COPY --from=builder --chown=guardiavault:nodejs /app/shared ./shared
# Note: Frontend is built to dist/public for Netlify deployment, not needed here

# Copy necessary config files (drizzle.config.ts not needed in production)
# COPY --chown=guardiavault:nodejs drizzle.config.ts ./
COPY --chown=guardiavault:nodejs server/scripts ./server/scripts
COPY --chown=guardiavault:nodejs migrations ./migrations
COPY --chown=guardiavault:nodejs scripts/startup.sh ./scripts/startup.sh

# Make startup script executable and create DNS backup (while still root)
USER root
RUN chmod +x scripts/startup.sh && \
    echo "nameserver 8.8.8.8" > /etc/resolv.conf.backup && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf.backup && \
    echo "nameserver 1.1.1.1" >> /etc/resolv.conf.backup && \
    chown guardiavault:nodejs /etc/resolv.conf.backup

# Set environment to production
ENV NODE_ENV=production

# Configure Node.js DNS resolution (prefer IPv4 first for better reliability)
# This helps with DNS resolution issues in some container environments
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Configure DNS resolution (use public DNS servers as fallback)
# This ensures DNS works even if container DNS is misconfigured
ENV DNS_SERVER_1=8.8.8.8
ENV DNS_SERVER_2=8.8.4.4
ENV DNS_SERVER_3=1.1.1.1

# Switch to non-root user
USER guardiavault

# Expose port (Railway will set PORT env var)
EXPOSE 5000

# Health check (uses PORT env var which Railway sets automatically)
# Increased start-period to 120s to allow full server initialization
# Using 0.0.0.0 instead of localhost for Railway compatibility
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=5 \
  CMD node -e "const http = require('http'); const port = process.env.PORT || '5000'; const req = http.get('http://0.0.0.0:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}); req.on('error', () => process.exit(1)); req.setTimeout(5000, () => {req.destroy(); process.exit(1)});"

# Start the application
# Railway automatically sets PORT env var, our server reads it
# Use startup script to run migrations first, then start server
CMD ["sh", "scripts/startup.sh"]

