# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build args
ARG REACT_APP_API_KEY
ARG REACT_APP_API_URL
ARG REACT_APP_ADMIN_MAIL

# Set environment variables for build
ENV REACT_APP_API_KEY=$REACT_APP_API_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ADMIN_MAIL=$REACT_APP_ADMIN_MAIL
ENV CI=false

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.31-alpine

LABEL maintainer="DevOps Team"
LABEL application="FashionShop Frontend"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
