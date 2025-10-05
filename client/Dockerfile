# Multi-stage build for React app
FROM node:22-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG VITE_NODE_ENV=production
ARG VITE_API_URL
ARG VITE_WS_URL

# Set environment variables
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx as root (simplest solution)
CMD ["nginx", "-g", "daemon off;"]