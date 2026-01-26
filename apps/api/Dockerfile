FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter api

# Copy source
COPY apps/api ./apps/api

# Build
RUN pnpm --filter api build

FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api ./apps/api

# Install all deps (need drizzle-kit for migrations)
RUN pnpm install --frozen-lockfile --filter api

WORKDIR /app/apps/api

# Make start script executable
RUN chmod +x start.sh

EXPOSE 80

CMD ["./start.sh"]
