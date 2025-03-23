FROM oven/bun:1.0.30 as build

WORKDIR /app

# Copy package files and dependencies
COPY web/package.json ./
COPY web/bun.lock ./
COPY core_types ./core_types

# Install dependencies
RUN bun install --frozen

# Copy the rest of the application
COPY web/ ./

# Build the application
RUN bun run build

# Production stage with nginx
FROM nginx:alpine

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]