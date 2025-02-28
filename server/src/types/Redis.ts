export interface RedisValue {
  [key: string]: any;
}

export interface RedisPubSubMessage {
  channel: string;
  message: string;
}

export type RedisCallback = (error: Error | null, result: any) => void; 