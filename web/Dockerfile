FROM node:20-alpine as build

WORKDIR /app

# Copy package files and dependencies
COPY web/package.json ./
COPY web/bun.lock ./
COPY core_types ./core_types

# Install dependencies using npm
RUN npm install

# Copy the rest of the application (excluding node_modules)
COPY web/src ./src
COPY web/public ./public
COPY web/index.html ./
COPY web/vite.config.ts ./
COPY web/tsconfig.json ./
COPY web/playwright.config.ts ./
COPY web/eslint.config.js ./

# Build the application
RUN npm run build

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