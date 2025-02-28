FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY web/package.json ./
COPY web/pnpm-lock.yaml ./
COPY core_types ./core_types

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY web/ ./

# Build the application
RUN pnpm build

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