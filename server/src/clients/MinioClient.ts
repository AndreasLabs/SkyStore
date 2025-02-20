import { Client } from 'minio';
import logger from '../logger';

export class MinioClient {
    private client: Client;
    private static instance: MinioClient;
    private bucket: string;

    constructor() {
        this.bucket = process.env.MINIO_BUCKET || "skystore";
        
        // Initialize Minio Client
        this.client = new Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9500'),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
        });
    }

    public static getInstance(): MinioClient {
        if (!MinioClient.instance) {
            MinioClient.instance = new MinioClient();
        }
        return MinioClient.instance;
    }

    /**
     * Initialize MinIO setup - ensures bucket exists and has proper policies
     */
    public async initialize(): Promise<void> {
        try {
            const bucketExists = await this.client.bucketExists(this.bucket);
            
            if (!bucketExists) {
                logger.info(`Creating bucket: ${this.bucket}`);
                await this.client.makeBucket(this.bucket, 'us-east-1');
                
                // Set bucket policy for public read access
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: [
                                's3:GetBucketLocation',
                                's3:ListBucket',
                                's3:ListBucketMultipartUploads'
                            ],
                            Resource: [`arn:aws:s3:::${this.bucket}`]
                        },
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: [
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                                's3:ListMultipartUploadParts',
                                's3:AbortMultipartUpload'
                            ],
                            Resource: [`arn:aws:s3:::${this.bucket}/*`]
                        }
                    ]
                };

                await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
                logger.info(`Bucket ${this.bucket} created and configured successfully`);
            } else {
                logger.info(`Bucket ${this.bucket} already exists`);
            }

            // Create standard folder structure
            const folders = [
                '.keep',
                'orgs/.keep'
            ];

            for (const folder of folders) {
                try {
                    await this.client.putObject(this.bucket, folder, '');
                    logger.info(`Created folder: ${folder}`);
                } catch (error) {
                    // Ignore if folder already exists
                    logger.warn(`Folder ${folder} may already exist:`, error);
                }
            }

        } catch (error) {
            logger.error('Failed to initialize MinIO:', error);
            throw error;
        }
    }

    /**
     * Creates an organization folder structure
     */
    public async createOrgStructure(orgKey: string): Promise<void> {
        const folders = [
            `orgs/${orgKey}/.keep`,
            `orgs/${orgKey}/projects/.keep`
        ];

        for (const folder of folders) {
            try {
                await this.client.putObject(this.bucket, folder, '');
                logger.info(`Created organization folder: ${folder}`);
            } catch (error) {
                logger.warn(`Folder ${folder} may already exist:`, error);
            }
        }
    }

    /**
     * Creates a project folder structure
     */
    public async createProjectStructure(orgKey: string, projectKey: string): Promise<void> {
        const folders = [
            `orgs/${orgKey}/projects/${projectKey}/.keep`,
            `orgs/${orgKey}/projects/${projectKey}/missions/.keep`
        ];

        for (const folder of folders) {
            try {
                await this.client.putObject(this.bucket, folder, '');
                logger.info(`Created project folder: ${folder}`);
            } catch (error) {
                logger.warn(`Folder ${folder} may already exist:`, error);
            }
        }
    }

    /**
     * Creates a mission folder structure
     */
    public async createMissionStructure(orgKey: string, projectKey: string, missionKey: string): Promise<void> {
        const folders = [
            `orgs/${orgKey}/projects/${projectKey}/missions/${missionKey}/.keep`,
            `orgs/${orgKey}/projects/${projectKey}/missions/${missionKey}/assets/.keep`
        ];

        for (const folder of folders) {
            try {
                await this.client.putObject(this.bucket, folder, '');
                logger.info(`Created mission folder: ${folder}`);
            } catch (error) {
                logger.warn(`Folder ${folder} may already exist:`, error);
            }
        }
    }

    /**
     * Lists all objects in a path
     */
    public async listObjects(prefix: string): Promise<string[]> {
        const objects: string[] = [];
        const stream = this.client.listObjects(this.bucket, prefix, true);
        
        return new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                if (obj.name) {
                    objects.push(obj.name);
                }
            });
            
            stream.on('error', reject);
            
            stream.on('end', () => {
                resolve(objects);
            });
        });
    }
} 