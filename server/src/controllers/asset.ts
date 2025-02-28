import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { S3Client } from "../clients/S3Client";
import logger from "../logger";
import { ServerError } from "../types/ServerError";
import { record } from '@elysiajs/opentelemetry';

// Type aliasing for Asset from Prisma
type Asset = Awaited<ReturnType<PrismaClient["asset"]["findUnique"]>>;
type AssetWithRelations = Asset & {
  mission?: { uuid: string; name: string; description: string | null } | null;
}

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

    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-m4v',
    

    // Point Cloud
    'application/octet-stream', // For .ply, .las, .laz, .pcd, .npy, .npz, .ply.gz, .las.gz, .laz.gz, .pcd.gz, .npy.gz, .npz.gz
]);

/**
 * Controller for managing assets using Prisma and S3
 */
export const assetController = {
    /**
     * Creates a new asset from an uploaded file
     * 
     * @param file - The uploaded file data
     * @param missionUuid - Optional mission UUID
     * 
     * @returns The created asset metadata
     */
    createAsset: async (
        file: File,
        ownerUuid: string,
        uploaderUuid: string,
        missionUuid?: string,
    ): Promise<AssetWithRelations> => {
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
                const extension = getFileExtension(file.name);
                
                // Upload file to storage using the simplified path
                const stored_path = await s3Client.uploadProjectFile(
                    ownerUuid,
                    assetId + extension,
                    file,
                    file.type
                );

                logger.info(`Asset ${assetId} uploaded to ${stored_path}`);
                
                // Generate download URL
                const downloadUrl = s3Client.getDownloadUrl(stored_path);
                
                // Generate thumbnail URL if applicable
                const thumbnailUrl = generateThumbnailUrl(stored_path, file.type);

                // Create asset in database using Prisma
                const asset = await prisma.asset.create({
                    data: {
                        uuid: assetId,
                        name: file.name,
                        stored_path: stored_path,
                        file_type: file.type,
                        extension: extension.substring(1), // Remove the dot
                        size_bytes: file.size,
                        download_url: downloadUrl,
                        thumbnail_url: thumbnailUrl,
                        mission_uuid: missionUuid,
                        owner_uuid: ownerUuid,
                        uploader_uuid: uploaderUuid,
                        access_uuids: [ownerUuid], // By default, owner has access
                    },
                    include: {
                        mission: false,
                    }
                });
                
                logger.info(`Asset ${assetId} created successfully`);
                return asset;
            } catch (error) {
                logger.error('Failed to create asset:', {
                    error: error instanceof Error ? error.message : String(error),
                    file_name: file.name,
                });
                throw error;
            }
        });
    },

    /**
     * Gets an asset by its ID
     * 
     * @param assetId - Asset UUID
     * @returns The asset metadata
     */
    getAssetById: async (assetId: string): Promise<AssetWithRelations> => {
        try {
            const asset = await prisma.asset.findUnique({
                where: { uuid: assetId },
                include: {
                    mission: true,
                }
            });

            if (!asset) {
                throw new ServerError('Asset not found', 404);
            }

            // Update presigned URL if needed
            const s3Client = S3Client.getInstance();
            const updatedDownloadUrl = s3Client.getDownloadUrl(asset.stored_path);
            
            // Update the download URL in the database if it has changed
            if (updatedDownloadUrl !== asset.download_url) {
                await prisma.asset.update({
                    where: { uuid: assetId },
                    data: { download_url: updatedDownloadUrl }
                });
                asset.download_url = updatedDownloadUrl;
            }

            return asset;
        } catch (error) {
            if (error instanceof ServerError) throw error;
            
            logger.error('Failed to get asset:', {
                error: error instanceof Error ? error.message : String(error),
                asset_id: assetId
            });
            throw new ServerError('Failed to get asset', 500);
        }
    },

    /**
     * Lists all assets for a user
     * 
     * @param ownerUuid - Owner user UUID
     * @returns Array of assets
     */
    listUserAssets: async (ownerUuid: string): Promise<AssetWithRelations[]> => {
        try {
            const assets = await prisma.asset.findMany({
                where: { owner_uuid: ownerUuid },
                include: {
                    mission: true,
                }
            });

            if (assets.length === 0) {
                logger.info(`No assets found for user ${ownerUuid}`);
                return [];
            }

            // Update all presigned URLs
            const s3Client = S3Client.getInstance();
            
            // Use a for loop to update assets in place
            for (const asset of assets) {
                // Update the download URL
                const updatedDownloadUrl = s3Client.getDownloadUrl(asset.stored_path);
                
                // Update in database if changed
                if (updatedDownloadUrl !== asset.download_url) {
                    await prisma.asset.update({
                        where: { uuid: asset.uuid },
                        data: { download_url: updatedDownloadUrl }
                    });
                    asset.download_url = updatedDownloadUrl;
                }
            }

            return assets;
        } catch (error) {
            logger.error('Failed to list assets:', {
                error: error instanceof Error ? error.message : String(error),
                owner_uuid: ownerUuid
            });
            throw new ServerError('Failed to list assets', 500);
        }
    },

    /**
     * Deletes an asset
     * 
     * @param assetId - Asset UUID
     */
    deleteAsset: async (assetId: string): Promise<void> => {
        try {
            // Get asset info first to get the file path
            const asset = await prisma.asset.findUnique({
                where: { uuid: assetId }
            });
            
            if (!asset) {
                throw new ServerError('Asset not found', 404);
            }
            
            // Delete from S3
            const s3Client = S3Client.getInstance();
            await s3Client.deleteFile(asset.stored_path);

            // Delete from database
            await prisma.asset.delete({
                where: { uuid: assetId }
            });

            logger.info(`Asset ${assetId} deleted successfully`);
        } catch (error) {
            logger.error('Failed to delete asset:', {
                error: error instanceof Error ? error.message : String(error),
                asset_id: assetId
            });
            throw error;
        }
    },
    
    /**
     * Add a user to the access list for an asset
     * 
     * @param assetId - Asset UUID
     * @param userUuid - User UUID to grant access
     */
    addUserAccess: async (assetId: string, userUuid: string): Promise<void> => {
        try {
            const asset = await prisma.asset.findUnique({
                where: { uuid: assetId }
            });
            
            if (!asset) {
                throw new ServerError('Asset not found', 404);
            }
            
            // Add user to access list if not already present
            if (!asset.access_uuids.includes(userUuid)) {
                await prisma.asset.update({
                    where: { uuid: assetId },
                    data: {
                        access_uuids: {
                            push: userUuid
                        }
                    }
                });
            }
            
            logger.info(`Access granted to user ${userUuid} for asset ${assetId}`);
        } catch (error) {
            logger.error('Failed to add user access:', {
                error: error instanceof Error ? error.message : String(error),
                asset_id: assetId,
                user_id: userUuid
            });
            throw error;
        }
    },
    
    /**
     * Remove a user from the access list for an asset
     * 
     * @param assetId - Asset UUID
     * @param userUuid - User UUID to revoke access
     */
    removeUserAccess: async (assetId: string, userUuid: string): Promise<void> => {
        try {
            const asset = await prisma.asset.findUnique({
                where: { uuid: assetId }
            });
            
            if (!asset) {
                throw new ServerError('Asset not found', 404);
            }
            
            // Check if user is owner - can't remove owner's access
            if (asset.owner_uuid === userUuid) {
                throw new ServerError('Cannot remove access from the owner', 400);
            }
            
            // Remove user from access list
            await prisma.asset.update({
                where: { uuid: assetId },
                data: {
                    access_uuids: asset.access_uuids.filter((uuid: string) => uuid !== userUuid)
                }
            });
            
            logger.info(`Access revoked for user ${userUuid} for asset ${assetId}`);
        } catch (error) {
            logger.error('Failed to remove user access:', {
                error: error instanceof Error ? error.message : String(error),
                asset_id: assetId,
                user_id: userUuid
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

/**
 * Helper function to generate thumbnail URL based on asset type and path
 * Implementation depends on your requirements
 */
function generateThumbnailUrl(path: string, fileType: string): string | null {
    // Simple implementation - in production you'd have more complex logic
    // to generate thumbnails for different file types
    if (fileType.startsWith('image/')) {
        return `${path}_thumbnail`;
    }
    return null;
} 