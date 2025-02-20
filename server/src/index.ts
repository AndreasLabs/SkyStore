import { Elysia } from "elysia";
import { RedisClient, RemoteRedisClient } from "./clients/RedisClient";
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
import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { S3Client } from "./clients/S3Client";

// Initialize clients
const redis: RedisClient = RemoteRedisClient(config.redis.url);

//const gcp = new GcpStorageClient(config.gcp.bucket, config.gcp.keyFilename);
const storage = S3Client.getInstance();
await storage.initialize();
// Create base app with state
const app = new Elysia()
.use(
  opentelemetry({
    serviceName: 'skystore-server',
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: 'http://localhost:4317/v1/traces',

        })
      )
    ],
  })
)
  .state('redis', redis)

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
