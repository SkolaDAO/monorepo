FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/platform/package.json ./apps/platform/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter platform...

# Copy source
COPY apps/platform ./apps/platform
COPY packages/ui ./packages/ui

# Build with production environment
ENV VITE_API_URL=https://api.skola.academy
ENV VITE_WALLET_CONNECT_PROJECT_ID=062761bc46d462832043929c0be8013c

# Build
RUN pnpm --filter platform build

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/platform/dist /usr/share/nginx/html

# SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
