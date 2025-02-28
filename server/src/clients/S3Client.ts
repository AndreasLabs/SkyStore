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
    }

    /**
     * Initialize the storage system
     * This ensures buckets and folder structures exist
     */
    public async initialize(): Promise<void> {
        await this.minioClient.initialize();
    }

    /**
     * Ensure organization structure exists
     */
    public async ensureOrgStructure(orgKey: string): Promise<void> {
        await this.minioClient.createOrgStructure(orgKey);
    }

    /**
     * Ensure project structure exists
     */
    public async ensureProjectStructure(orgKey: string, projectKey: string): Promise<void> {
        await this.minioClient.createProjectStructure(orgKey, projectKey);
    }

    /**
     * Ensure mission structure exists
     */
    public async ensureMissionStructure(orgKey: string, projectKey: string, missionKey: string): Promise<void> {
        await this.minioClient.createMissionStructure(orgKey, projectKey, missionKey);
    }

    public static getInstance(): S3Client {
        if (!S3Client.instance) {
            S3Client.instance = new S3Client();
        }
        return S3Client.instance;
    }

    /**
     * Gets a reference to a file in the organization's storage
     * Pattern: orgs/{orgKey}/projects/{projectKey}/files/{filename}
     */
    public getProjectFile(orgKey: string, projectKey: string, filename: string): S3File {
        const path = `orgs/${orgKey}/projects/${projectKey}/files/${filename}`;
        logger.info(`Getting S3 file reference: ${path}`);
        return this.client.file(path);
    }

    /**
     * Uploads a file to the organization's storage
     */
    public async uploadProjectFile(
        orgKey: string, 
        projectKey: string, 
        filename: string, 
        data: string | S3File | Blob | ArrayBuffer | SharedArrayBuffer | Response | Request | ArrayBufferView,
        contentType?: string
    ): Promise<void> {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        logger.info(`Uploading file to S3: ${filename}`);
        await file.write(data, contentType ? { type: contentType } : undefined);
    }

    /**
     * Generates a pre-signed URL for file download
     * Expires in 24 hours by default
     */
    public getDownloadUrl(
        orgKey: string, 
        projectKey: string, 
        filename: string, 
        expiresIn: number = 60 * 60 * 24
    ): string {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        return file.presign({
            expiresIn,
            acl: "public-read"
        });
    }

    /**
     * Generates a pre-signed URL for file upload
     */
    public getUploadUrl(
        orgKey: string, 
        projectKey: string, 
        filename: string, 
        expiresIn: number = 60 * 60
    ): string {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        return file.presign({
            expiresIn,
            method: "PUT",
            acl: "public-read"
        });
    }

    /**
     * Deletes a file from storage
     */
    public async deleteProjectFile(orgKey: string, projectKey: string, filename: string): Promise<void> {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        logger.info(`Deleting file from S3: ${filename}`);
        await file.delete();
    }

    /**
     * Checks if a file exists
     */
    public async fileExists(orgKey: string, projectKey: string, filename: string): Promise<boolean> {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        return await file.exists();
    }

    /**
     * Gets file metadata
     */
    public async getFileMetadata(orgKey: string, projectKey: string, filename: string) {
        const file = this.getProjectFile(orgKey, projectKey, filename);
        return await file.stat();
    }
} 