FROM oven/bun:1.0.30 as base

WORKDIR /usr/src/app

# Copy package files and dependencies and workspace

COPY server/ ./server
COPY web/ ./web
COPY package.json ./package.json
COPY core_types ./core_types

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY server/ ./server

# Expose the port your app runs on
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "server/src/index.ts"] 