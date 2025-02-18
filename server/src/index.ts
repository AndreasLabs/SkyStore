import { Elysia } from "elysia";
import { RedisClient } from "./clients/RedisClient";
import { StorageClient } from "./clients/MinioClient";
import { GcpStorageClient } from "./clients/GcpStorageClient";
import { config } from "./config";
import logger from './logger';
import { userRoutes } from './routes/user';
import { organizationRoutes } from './routes/organization';
import { projectRoutes } from './routes/project';
import { taskRoutes } from './routes/task';
import { assetRoutes } from './routes/asset';
import { State } from "./types/State";

// Initialize clients
const redis = new RedisClient(config.redis.url);
const storage = new StorageClient(config.minio);
//const gcp = new GcpStorageClient(config.gcp.bucket, config.gcp.keyFilename);

// Create base app with state
const app = new Elysia()
  .state('redis', redis)
  .state('storage', storage)
  .derive(() => ({
    // Add JSON content type to all responses
    headers: {
      'content-type': 'application/json'
    }
  }))
  .onRequest(({ request }) => {
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || '-';
    logger.info(`${method} ${url} ${userAgent}`);
  })
  .use(userRoutes)
  .use(organizationRoutes)
  .use(projectRoutes)
  .use(taskRoutes)
  .use(assetRoutes)
  .get("/", () => {
    logger.info("Handling root request");
    return "Hello Elysia";
  })
  .listen(3000);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// Cleanup on exit
process.on('SIGTERM', async () => {
  logger.info('Server is shutting down');
  await redis.close();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
