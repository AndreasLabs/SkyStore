import { Client } from 'minio';

export class MinioClient {
  private client: Client;

  constructor(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    private bucket: string
  ) {
    const [host, port] = endpoint.split(':');
    this.client = new Client({
      endPoint: host,
      port: parseInt(port),
      useSSL: false,
      accessKey,
      secretKey,
    });
  }

  async getPresignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    return await this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }

  async getPresignedUrls(objectNames: string[], expirySeconds = 3600): Promise<string[]> {
    return await Promise.all(
      objectNames.map((name) => this.getPresignedUrl(name, expirySeconds))
    );
  }
} 