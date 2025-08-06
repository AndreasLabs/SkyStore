import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { S3Client } from "../clients/S3Client";
import logger from "../logger";
import { ServerError } from "../types/ServerError";
import { record } from '@elysiajs/opentelemetry';

// Type aliasing for Asset from Prisma
type Asset = Awaited<ReturnType<PrismaClient["asset"]["findUnique"]>>;
type AssetWithRelations = Asset & {
  flight?: { uuid: string; name: string; description: string | null } | null;
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
     * @param flightUuid - Optional flight UUID
     * 
     * @returns The created asset metadata
     */
    createAsset: async (
        file: File,
        ownerUuid: string,
        uploaderUuid: string,
        flightUuid?: string,
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
                        flight_uuid: flightUuid,
                        owner_uuid: ownerUuid,
                        uploader_uuid: uploaderUuid,
                        access_uuids: [ownerUuid], // By default, owner has access
                    },
                    include: {
                        flight: true,
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
                    flight: true,
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
    /**
     * Lists assets for a user with optional filtering
     * 
     * @param ownerUuid - Owner user UUID
     * @param options - Optional query parameters
     * @param options.flightUuid - Optional flight UUID to filter by
     * @returns Array of assets
     */
    listUserAssets: async (ownerUuid: string, options?: { flightUuid?: string }): Promise<AssetWithRelations[]> => {
        try {
            const assets = await prisma.asset.findMany({
                where: { owner_uuid: ownerUuid, flight_uuid: options?.flightUuid },
                include: {
                    flight: true,
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
    },

    /**
     * Creates a new asset record for an already uploaded file
     * 
     * Required parameters:
     * @param storedPath - The path where the file is stored in S3/Minio
     * @param fileName - Original file name
     * @param fileType - MIME type of the file
     * @param sizeBytes - Size of the file in bytes
     * @param ownerUuid - UUID of the asset owner
     * @param uploaderUuid - UUID of the user who uploaded the file
     * @param flightUuid - Optional UUID of associated flight
     * 
     * @returns The created asset metadata
     */
    createAssetFromExisting: async (
        storedPath: string,
        ownerUuid: string,
        uploaderUuid: string,
        flightUuid?: string,
    ): Promise<AssetWithRelations> => {
        // Extract file information from the stored path
        const s3Client = S3Client.getInstance();
        
        // Parse the path to get file name
        const fileName = storedPath.split('/').pop() || 'unknown';
        
        try {
            // Get file metadata from S3
            logger.info(`Getting S3 file reference: ${storedPath}`);
            const fileMetadata = await s3Client.getFileMetadata(storedPath);
            const fileType = fileMetadata.type || 'application/octet-stream';
            const sizeBytes = fileMetadata.size || 0;
            
            // Validate file type
            if (!ACCEPTED_MIME_TYPES.has(fileType)) {
                logger.error(`Invalid file type: ${fileType}`);
                throw new ServerError(`File type not accepted: ${fileType}`, 400);
            }

            // Generate UUID for asset
            const assetId = crypto.randomUUID();
            
            return record('asset.create_from_existing', async (span) => {
                try {
                    const extension = getFileExtension(fileName);
                    
                    // Move file to assets directory
                    const newStoredPath = `assets/${ownerUuid}/${assetId}${extension}`;
                    
                    // Get file data from original location
                    const fileData = s3Client.getFile(storedPath);
                    
                    // Upload to new location
                    await s3Client.uploadFile(newStoredPath, fileData, fileType);
                    
                    // Generate download URL
                    const downloadUrl = s3Client.getDownloadUrl(newStoredPath);
                    
                    // Generate thumbnail URL if applicable
                    const thumbnailUrl = generateThumbnailUrl(newStoredPath, fileType);

                    // Create asset in database using Prisma
                    const asset = await prisma.asset.create({
                        data: {
                            uuid: assetId,
                            name: fileName,
                            stored_path: newStoredPath,
                            file_type: fileType,
                            extension: extension.substring(1), // Remove the dot
                            size_bytes: sizeBytes,
                            download_url: downloadUrl,
                            thumbnail_url: thumbnailUrl,
                            flight_uuid: flightUuid,
                            owner_uuid: ownerUuid,
                            uploader_uuid: uploaderUuid,
                            access_uuids: [ownerUuid], // By default, owner has access
                        },
                        include: {
                            flight: true,
                        }
                    });
                    
                    // Delete the original file after successful move
                    await s3Client.deleteFile(storedPath);
                    
                    logger.info(`Asset ${assetId} created from existing file at ${storedPath}, moved to ${newStoredPath}`);
                    return asset;
                } catch (error) {
                    logger.error('Failed to create asset record:', {
                        error: error instanceof Error ? error.message : String(error),
                        stored_path: storedPath,
                    });
                    throw error;
                }
            });
        } catch (error) {
            logger.error('Failed to get file metadata:', {
                error: error instanceof Error ? error.message : String(error),
                stored_path: storedPath,
            });
            
            if (error instanceof Error && error.message.includes('ConnectionRefused')) {
                throw new ServerError('Unable to connect to storage service. Please check your connection and try again.', 503);
            }
            
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
    // For image files, generate a pre-signed URL for direct access
    if (fileType.startsWith('image/')) {
        const s3Client = S3Client.getInstance();
        return s3Client.getDownloadUrl(path);
    }
    return null;
} 