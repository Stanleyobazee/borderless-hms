# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .

# Pass API URL at build time (can be overridden)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Runtime Stage ----
FROM nginx:1.25-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid \
    && chown -R appuser:appgroup /etc/nginx/conf.d

USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
