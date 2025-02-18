import { Client as MinioClient, ItemBucketMetadata } from 'minio';

export class StorageClient {
  private client: MinioClient;
  private bucket: string;

  constructor(config: {
    endPoint: string;
    port?: number;
    useSSL?: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  }) {
    const { bucket, ...minioConfig } = config;
    this.client = new MinioClient(minioConfig);
    this.bucket = bucket;
  }

  async uploadFile(path: string, file: Buffer, metadata?: ItemBucketMetadata) {
    const metadataOptions = {
      'Content-Type': metadata?.contentType || 'application/octet-stream',
      ...metadata
    };
    await this.client.putObject(this.bucket, path, file, metadataOptions);
  }

  async listObjects(prefix: string = '') {
    const objects: string[] = [];
    const stream = this.client.listObjects(this.bucket, prefix, true);
    
    return new Promise<string[]>((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) objects.push(obj.name);
      });
      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  async getObject(path: string) {
    return await this.client.getObject(this.bucket, path);
  }

  async getSignedUrl(path: string, expirySeconds: number = 3600) {
    return await this.client.presignedGetObject(this.bucket, path, expirySeconds);
  }

  async getSignedPutUrl(path: string, expirySeconds: number = 3600) {
    return await this.client.presignedPutObject(this.bucket, path, expirySeconds);
  }
} 