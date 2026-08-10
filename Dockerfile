FROM node:22.23.0-slim AS builder

RUN corepack enable

WORKDIR /app

# Copy dependency files and lock file for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies using the locked pnpm version
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

FROM node:22.23.0-alpine AS runner

RUN corepack enable

WORKDIR /root/app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Run application
CMD ["node", "dist/index.js"]
