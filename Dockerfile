FROM node:22-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

# Копируем зависимостей и lock-файл для кэширования
COPY package.json pnpm-lock.yaml ./

# Установить все зависимости (смотрит на lock файл)
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-slim AS runner

RUN npm install -g pnpm

WORKDIR /root/app

# копируем сбилженный код
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./

# Ставим только production-зависимости
RUN pnpm install --frozen-lockfile --prod

# Запустить приложение
CMD ["node", "dist/index.js"]

