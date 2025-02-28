import { Asset } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";
import { S3Client } from "../clients/S3Client";
import logger from "../logger";
import { ServerError } from "../types/ServerError";
import { record } from '@elysiajs/opentelemetry';

// Accepted MIME types for upload
const ACCEPTED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    // 3D Files
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream', // For .obj, .fbx etc
    'text/plain', // For .obj, .mtl
    'application/x-tgif', // .obj
]);

/**
 * Controller for managing assets in Redis and S3
 */
export const assetController = {
    /**
     * Creates a new asset from an uploaded file
     * 
     * @param file - The uploaded file data
     * @param orgKey - Organization key
     * @param projectKey - Project key
     * @param missionKey - Mission key
     * @param redis - Redis client
     * 
     * Storage in Redis:
     * - Asset info: `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}:assets:${assetId}:info`
     * 
     * Storage in S3:
     * - File: `orgs/${orgKey}/projects/${projectKey}/missions/${missionKey}/assets/${assetId}`
     * 
     * @returns The created asset metadata
     */
    createAsset: async (
        file: File,
        orgKey: string,
        projectKey: string,
        missionKey: string,
        redis: RedisClient
    ): Promise<Asset> => {
        // Validate file type
        if (!ACCEPTED_MIME_TYPES.has(file.type)) {
            logger.error(`Invalid file type: ${file.type}`);
            throw new ServerError(`File type not accepted: ${file.type}`, 400);
        }

        // Generate UUID for asset
        const assetId = crypto.randomUUID();
        
        return record('asset.create', async (span) => {
            try {
                const s3Client = S3Client.getInstance();
                
                // Ensure folder structure exists
                await s3Client.ensureMissionStructure(orgKey, projectKey, missionKey);
                
                // Upload to S3
                const s3Path = `missions/${missionKey}/assets/${assetId}${getFileExtension(file.name)}`;
                logger.info(`Uploading file to S3: ${s3Path}`);
                await s3Client.uploadProjectFile(
                    orgKey,
                    projectKey,
                    s3Path,
                    file,
                    file.type
                );

                // Create asset metadata
                const asset: Asset = {
                    id: assetId,
                    originalName: file.name,
                    contentType: file.type,
                    size: file.size,
                    path: s3Path,
                    uploadedAt: new Date().toISOString(),
                    presignedUrl: s3Client.getDownloadUrl(
                        orgKey,
                        projectKey,
                        s3Path
                    ),
                    directUrl: `s3://${orgKey}/${projectKey}/${s3Path}`
                };

                // Save metadata to Redis
                const redisPath = `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}:assets:${assetId}`;
                await redis.setObject(`${redisPath}:info`, JSON.parse(JSON.stringify(asset)));

                // Add to mission's assets set
                await redis.sadd(
                    `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}:assets:members`,
                    assetId
                );

                await redis.publish(`asset:event_created`, JSON.stringify(asset));

                logger.info(`Asset ${assetId} created successfully`);
                return asset;
            } catch (error) {
                logger.error('Failed to create asset:', {
                    error: error instanceof Error ? error.message : String(error),
                    file_name: file.name,
                    org_key: orgKey,
                    project_key: projectKey,
                    mission_key: missionKey
                });
                throw error;
            }
        });
    },

    /**
     * Gets an asset by its ID
     * 
     * @param orgKey - Organization key
     * @param projectKey - Project key
     * @param missionKey - Mission key
     * @param assetId - Asset ID
     * @param redis - Redis client
     * 
     * @returns The asset metadata
     */
    getAssetById: async (
        orgKey: string,
        projectKey: string,
        missionKey: string,
        assetId: string,
        redis: RedisClient
    ): Promise<Asset> => {
        const redisPath = `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}:assets:${assetId}`;
        const asset = await redis.getObject(`${redisPath}:info`) as Asset | null;

        if (!asset) {
            throw new ServerError('Asset not found', 404);
        }

        // Update presigned URL
        const s3Client = S3Client.getInstance();
        asset.presignedUrl = s3Client.getDownloadUrl(
            orgKey,
            projectKey,
            asset.path
        );

        return asset;
    },

    /**
     * Lists all assets for a mission
     * 
     * @param orgKey - Organization key
     * @param projectKey - Project key
     * @param missionKey - Mission key
     * @param redis - Redis client
     * 
     * @returns Array of assets
     */
    listMissionAssets: async (
        orgKey: string,
        projectKey: string,
        missionKey: string,
        redis: RedisClient
    ): Promise<Asset[]> => {
        try {
            const redisPath = `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}`;
            const assetIds = await redis.smembers(`${redisPath}:assets:members`);

            if (assetIds.length === 0) {
                logger.info(`No assets found for mission ${missionKey}`);
                return [];
            }

            const s3Client = S3Client.getInstance();

            // Get info for each asset and update presigned URLs
            const assets = await Promise.all(assetIds.map(async (id) => {
                const asset = await redis.getObject(`${redisPath}:assets:${id}:info`) as Asset | null;
                if (asset) {
                    asset.presignedUrl = s3Client.getDownloadUrl(
                        orgKey,
                        projectKey,
                        asset.path
                    );
                }
                return asset;
            }));

            return assets.filter((asset): asset is Asset => asset !== null);
        } catch (error) {
            logger.error('Failed to list assets:', {
                error: error instanceof Error ? error.message : String(error),
                org_key: orgKey,
                project_key: projectKey,
                mission_key: missionKey
            });
            throw new ServerError('Failed to list assets', 500);
        }
    },

    /**
     * Deletes an asset
     * 
     * @param orgKey - Organization key
     * @param projectKey - Project key
     * @param missionKey - Mission key
     * @param assetId - Asset ID
     * @param redis - Redis client
     */
    deleteAsset: async (
        orgKey: string,
        projectKey: string,
        missionKey: string,
        assetId: string,
        redis: RedisClient
    ): Promise<void> => {
        try {
            // Get asset info first to get the file path
            const asset = await assetController.getAssetById(orgKey, projectKey, missionKey, assetId, redis);
            
            // Delete from S3
            const s3Client = S3Client.getInstance();
            await s3Client.deleteProjectFile(
                orgKey,
                projectKey,
                asset.path
            );

            // Delete from Redis
            const redisPath = `orgs:${orgKey}:projects:${projectKey}:missions:${missionKey}`;
            await redis.del(`${redisPath}:assets:${assetId}:info`);
            await redis.srem(`${redisPath}:assets:members`, assetId);

            await redis.publish(`asset:event_deleted`, JSON.stringify({
                organization_key: orgKey,
                project_key: projectKey,
                mission_key: missionKey,
                asset_id: assetId
            }));

            logger.info(`Asset ${assetId} deleted successfully`);
        } catch (error) {
            logger.error('Failed to delete asset:', {
                error: error instanceof Error ? error.message : String(error),
                org_key: orgKey,
                project_key: projectKey,
                mission_key: missionKey,
                asset_id: assetId
            });
            throw error;
        }
    }
};

/**
 * Helper function to get file extension from filename
 */
function getFileExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
} 