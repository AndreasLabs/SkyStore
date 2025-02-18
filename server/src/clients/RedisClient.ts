
import RedisMock from 'ioredis-mock';
import { RedisValue, RedisPubSubMessage } from '../types/Redis';
import logger from '../logger';
import Redis from 'ioredis';

export const MockedRedisClient = () => {
  const client = new RedisMock();
  logger.info('Using mocked Redis client');
  return new RedisClient(client);
}

export const RemoteRedisClient = (url: string) => {
  let client: Redis;
  if (url) {
    client = new Redis(url);
    logger.info('Using remote Redis client');
  } else {
    client = new Redis();
    logger.info('Using local Redis client');
  }
  return new RedisClient(client);
}

export class RedisClient {
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  constructor(client: Redis) {
    logger.info('Using provided Redis client');
      // Use provided client (for testing)
    this.client = client;
    this.pubClient = client;
    this.subClient = client;
  }

  // High-level Function to save a JS object using native Redis types
  async setObject(key: string, object: Record<string, unknown>, expireSeconds?: number) {
    // Handle empty objects
    if (Object.keys(object).length === 0) {
      logger.info(`Setting empty object for key: ${key}`);
      await this.set(key, '{}', expireSeconds);
      return;
    }

    const pipeline = this.client.pipeline();

    for (const [k, v] of Object.entries(object)) {
      if (v === null || v === undefined) {
        continue;
      }

      const fieldKey = `${key}:${k}`;

      if (Array.isArray(v)) {
        // Store arrays as Redis lists
        pipeline.del(fieldKey); // Clear existing list
        pipeline.rpush(fieldKey, ...v.map(String));
      } else if (v instanceof Date) {
        // Store dates as ISO strings
        pipeline.set(fieldKey, v.toISOString());
      } else if (typeof v === 'object') {
        // Store nested objects recursively
        await this.setObject(fieldKey, v as Record<string, unknown>);
      } else if (typeof v === 'number') {
        // Store numbers using Redis number type
        pipeline.set(fieldKey, v);
      } else {
        // Store other primitives as strings
        pipeline.set(fieldKey, String(v));
      }

      if (expireSeconds) {
        pipeline.expire(fieldKey, expireSeconds);
      }
    }
    logger.info(`Executing pipeline for key: ${key}`);
    await pipeline.exec();
  }

  // High-level Function to get a JS object from Redis
  async getObject(key: string) {
    const keys = await this.keys(`${key}:*`);
    if (keys.length === 0) return null;

    const result: Record<string, any> = {};
    const pipeline = this.client.pipeline();

    for (const fullKey of keys) {
      const field = fullKey.slice(key.length + 1);
      const type = await this.client.type(fullKey);

      switch (type) {
        case 'list':
          pipeline.lrange(fullKey, 0, -1);
          break;
        case 'string':
          pipeline.get(fullKey);
          break;
      }
    }

    const responses = await pipeline.exec();
    if (!responses) return null;

    responses.forEach((response, index) => {
      if (!response) return;
      
      const [err, value] = response;
      if (err) return;

      const field = keys[index].slice(key.length + 1);
      
      // Convert numeric strings to numbers
      if (typeof value === 'string' && !isNaN(Number(value))) {
        result[field] = Number(value);
      } else {
        result[field] = value;
      }
    });

    return result;
  }

  private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object') {
        Object.assign(flattened, this.flattenObject(value as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }

    return flattened;
  }

  // Basic Key-Value Operations
  async set(key: string, value: string, expireSeconds?: number) {
    if (expireSeconds) {
      return await this.client.set(key, value, 'EX', expireSeconds);
    }
    return await this.client.set(key, value);
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async del(key: string) {
    return await this.client.del(key);
  }

  // List all keys matching a pattern
  async keys(pattern: string) {
    return await this.client.keys(pattern);
  }

  // Set Operations
  async sadd(key: string, ...members: string[]) {
    return await this.client.sadd(key, ...members);
  }

  async smembers(key: string) {
    return await this.client.smembers(key);
  }

  async srem(key: string, ...members: string[]) {
    return await this.client.srem(key, ...members);
  }

  // JSON Operations
  async setJson(key: string, value: RedisValue, expireSeconds?: number) {
    return await this.set(key, JSON.stringify(value), expireSeconds);
  }

  async getJson<T extends RedisValue>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  // Pub/Sub Operations
  async publish(channel: string, message: string) {

    if (this.pubClient === this.subClient) {
      return await this.client.publish(channel, message);
    }
    return await this.pubClient.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subClient.subscribe(channel);
    this.subClient.on('message', (chan, message) => {
      if (chan === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string) {
    await this.subClient.unsubscribe(channel);
  }

  // Cleanup
  async close() {
    await this.client.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }

  async flushall() {
    await this.client.flushall();
    await this.pubClient.flushall();
    await this.subClient.flushall();
  }
} 