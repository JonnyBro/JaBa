FROM node:22-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy dependency files and lock file for caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies using lock file
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-alpine AS runner

RUN npm install -g pnpm

WORKDIR /root/app

# Copy built code
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Run the application
CMD ["node", "dist/index.js"]
