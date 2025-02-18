import { RedisClient } from '../clients/RedisClient';
import { StorageClient } from '../clients/MinioClient';

export interface State {
  redis: RedisClient;
  storage: StorageClient;
} 