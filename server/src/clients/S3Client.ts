import { S3Client as BunS3Client, type S3File } from "bun";
import logger from "../logger";
import { MinioClient } from "./MinioClient";

export class S3Client {
    private client: BunS3Client;
    private static instance: S3Client;
    private minioClient: MinioClient;

    constructor() {
        const bucket = process.env.MINIO_BUCKET || "skystore";
        // Default to MinIO configuration from docker-compose
        this.client = new BunS3Client({
            accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
            secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
            bucket: bucket,
            endpoint: `http://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || "9500"}`,
            // For GCP, would be: endpoint: "https://storage.googleapis.com"
        });

        this.minioClient = MinioClient.getInstance();

        this.ensureDropboxStructure("vfp");
        this.ensureUserStructure("vfp");
        this.ensureAssetsStructure("vfp", "vfp");
    }

    /**
     * Initialize the storage system
     * This ensures buckets and folder structures exist
     */
    public async initialize(): Promise<void> {
        await this.minioClient.initialize();
    }

    /**
     * Ensure user structure exists
     */
    public async ensureUserStructure(user_uuid: string): Promise<void> {
        await this.minioClient.createUserStructure(user_uuid);
    }

    /**
     * Ensure assets structure exists
     */
    public async ensureAssetsStructure(user_uuid: string, assetKey: string): Promise<void> {
        await this.minioClient.createAssetsStructure(user_uuid, assetKey);
    }

    public async ensureDropboxStructure(user_uuid: string): Promise<void> {
        await this.minioClient.createDropboxStructure(user_uuid);
    }

    public static getInstance(): S3Client {
        if (!S3Client.instance) {
            S3Client.instance = new S3Client();
        }
        return S3Client.instance;
    }

    /**
     * Gets a reference to a file using its stored path
     */
    public getFile(stored_path: string): S3File {
        logger.info(`Getting S3 file reference: ${stored_path}`);
        return this.client.file(stored_path);
    }

    /**
     * Gets file using a raw storage path such as a s3 path
     */
    public getFilePath(stored_path: string): S3File {
        return this.client.file(stored_path);
    }

    /**
     * Uploads a file to storage using the stored path
     */
    public async uploadFile(
        stored_path: string, 
        data: string | S3File | Blob | ArrayBuffer | SharedArrayBuffer | Response | Request | ArrayBufferView,
        contentType?: string
    ): Promise<void> {
        const file = this.getFile(stored_path);
        logger.info(`Uploading file to S3: ${stored_path}`);
        await file.write(data, contentType ? { type: contentType } : undefined);
    }

    /**
     * Uploads a file to the project storage
     */
    public async uploadProjectFile(
        user_uuid: string,
        filename: string, 
        data: string | S3File | Blob | ArrayBuffer | SharedArrayBuffer | Response | Request | ArrayBufferView,
        contentType?: string
    ): Promise<string> {
        const stored_path = `assets/${user_uuid}/${filename}`;
        const file = this.getFile(stored_path);
        logger.info(`Uploading file to S3: ${stored_path}`);
        await file.write(data, contentType ? { type: contentType } : undefined);
        return stored_path;
    }

    /**
     * Generates a pre-signed URL for file download
     * Expires in 24 hours by default
     */
    public getDownloadUrl(
        stored_path: string, 
        expiresIn: number = 60 * 60 * 24
    ): string {
        const file = this.getFile(stored_path);
        return file.presign({
            expiresIn,
            acl: "public-read"
        });
    }

    /**
     * Generates a pre-signed URL for file upload
     */
    public getUploadUrl(
        stored_path: string, 
        expiresIn: number = 60 * 60
    ): string {
        const file = this.getFile(stored_path);
        return file.presign({
            expiresIn,
            method: "PUT",
            acl: "public-read"
        });
    }

    /**
     * Deletes a file from storage
     */
    public async deleteFile(stored_path: string): Promise<void> {
        const file = this.getFile(stored_path);
        logger.info(`Deleting file from S3: ${stored_path}`);
        await file.delete();
    }

    /**
     * Checks if a file exists
     */
    public async fileExists(stored_path: string): Promise<boolean> {
        const file = this.getFile(stored_path);
        return await file.exists();
    }

    /**
     * Gets file metadata
     */
    public async getFileMetadata(stored_path: string) {
        const file = this.getFile(stored_path);
        return await file.stat();
    }
} 