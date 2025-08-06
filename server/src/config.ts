import { Config } from './types/Config';

export const config: Config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:4162'
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'skystore'
  },
  gcp: {
    bucket: process.env.GCP_BUCKET || 'default-bucket',
    keyFilename: process.env.GCP_KEY_FILE
  }
}; 