FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/docs/package.json ./apps/docs/

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm build

FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=builder /app/apps/docs/.vitepress/dist ./dist
COPY --from=builder /app/apps/docs/package.json ./

RUN pnpm add serve

EXPOSE 3000

CMD ["npx", "serve", "dist", "-l", "3000"]
