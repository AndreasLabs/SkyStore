import { Elysia } from "elysia";
import { RedisClient, RemoteRedisClient } from "./clients/RedisClient";
import { config } from "./config";
import logger from './logger';
import { assetRoutes } from './routes/asset';
import { cors } from '@elysiajs/cors';
import { opentelemetry } from '@elysiajs/opentelemetry';
import { swagger } from '@elysiajs/swagger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { S3Client } from "./clients/S3Client";

// Initialize clients
const redis: RedisClient = RemoteRedisClient(config.redis.url);

//const gcp = new GcpStorageClient(config.gcp.bucket, config.gcp.keyFilename);
const storage = S3Client.getInstance();
await storage.initialize();

// Create base app with state
const app = new Elysia();

// Apply plugins manually to avoid TypeScript errors
// @ts-ignore - Suppress TypeScript errors for plugin compatibility
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// @ts-ignore - Suppress TypeScript errors for plugin compatibility
app.use(swagger())

// @ts-ignore - Suppress TypeScript errors for plugin compatibility
app.use(opentelemetry({
  serviceName: 'skystore-server',
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: 'http://localhost:4317/v1/traces',
      })
    )
  ],
}));

// Add state and routes
app.state('redis', redis);
app.onRequest(({ request }) => {
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '-';
  logger.info(`${method} ${url} ${userAgent}`);
});
app.use(assetRoutes);

// Start the server
app.listen(4000);

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
