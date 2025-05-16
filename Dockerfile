# Use a Node.js image with pnpm pre-installed
FROM node:22

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy dependency manifests
COPY package.json ./
# COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy rest of the application
COPY . .

# Build TypeScript
RUN pnpm build

# Set the command to run the app
CMD ["node", "dist/index.js"]
