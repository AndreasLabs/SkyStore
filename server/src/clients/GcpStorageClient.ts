import { Storage } from '@google-cloud/storage';

export class GcpStorageClient {
  private storage: Storage;
  private bucket: string;

  constructor(bucketName: string, keyFilename?: string) {
    this.storage = new Storage({
      keyFilename
    });
    this.bucket = bucketName;
  }

  async uploadFile(path: string, file: Buffer, metadata?: { [key: string]: string }) {
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(path);
    await blob.save(file, {
      metadata: {
        metadata
      }
    });
  }

  async listObjects(prefix: string = '') {
    const [files] = await this.storage.bucket(this.bucket).getFiles({
      prefix
    });
    return files.map(file => file.name);
  }

  async getObject(path: string) {
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(path);
    const [buffer] = await blob.download();
    return buffer;
  }

  async getSignedUrl(path: string, expirySeconds: number = 3600) {
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(path);
    const [url] = await blob.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirySeconds * 1000
    });
    return url;
  }

  async getSignedPutUrl(path: string, expirySeconds: number = 3600) {
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(path);
    const [url] = await blob.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expirySeconds * 1000
    });
    return url;
  }
} 