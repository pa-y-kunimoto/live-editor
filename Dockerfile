# syntax=docker/dockerfile:1

# Base stage with pnpm
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/code-block/package.json ./packages/code-block/
COPY packages/list/package.json ./packages/list/
COPY packages/table/package.json ./packages/table/
COPY packages/quote/package.json ./packages/quote/
COPY packages/link/package.json ./packages/link/
COPY packages/history/package.json ./packages/history/
COPY packages/document/package.json ./packages/document/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/code-block/node_modules ./packages/code-block/node_modules
COPY --from=deps /app/packages/list/node_modules ./packages/list/node_modules
COPY --from=deps /app/packages/table/node_modules ./packages/table/node_modules
COPY --from=deps /app/packages/quote/node_modules ./packages/quote/node_modules
COPY --from=deps /app/packages/link/node_modules ./packages/link/node_modules
COPY --from=deps /app/packages/history/node_modules ./packages/history/node_modules
COPY --from=deps /app/packages/document/node_modules ./packages/document/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm -r build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/apps/web/.output ./apps/web/.output

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
