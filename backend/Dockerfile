# Stage 1: Build native dependencies and production node_modules
FROM node:25-alpine AS builder

WORKDIR /usr/src/app

# Install build tools for native modules like bcrypt
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Stage 2: Runtime
FROM node:25-alpine AS runtime

LABEL maintainer="DevOps Team"
LABEL application="FashionShop Backend"
LABEL version="1.0"

WORKDIR /usr/src/app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from builder
COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Use non-root user
USER appuser

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
