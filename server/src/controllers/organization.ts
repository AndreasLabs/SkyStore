import { Organization, CreateOrganizationBody } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";
import logger from "../logger";
import { ServerError } from "../types/ServerError";

/**
 * Verifies that an organization key is valid
 * Must be lowercase alphanumeric with optional dashes between parts
 */
const verifyOrganizationKey = (key: string): boolean => {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key);
}

/**
 * Controller for managing organizations in Redis
 */
export const organizationController = {
    /**
     * Creates a new organization
     * 
     * @param key - The organization key
     * @param orgData - The organization data to create
     * @param store - Store containing Redis client
     * 
     * @throws Error if required fields are missing or invalid
     * 
     * Storage in Redis:
     * - Organization info: `orgs:${key}:info`
     * 
     * Events published:
     * - `organization:created` - When organization is successfully created
     * 
     * @returns The created organization
     */
    createOrganization: async (key: string, orgData: CreateOrganizationBody, store: { redis: RedisClient }): Promise<Organization> => {
        try {
            // Validate required fields
            const requiredFields = ['name', 'description'];
            for (const field of requiredFields) {
                if (!orgData[field as keyof CreateOrganizationBody]) {
                    logger.error(`${field} is required`);
                    throw new ServerError(`${field} is required`, 400);
                }
            }

            // Validate organization key format
            if (!verifyOrganizationKey(key)) {
                logger.error('Invalid organization key format');
                throw new ServerError('Invalid organization key format. Must be lowercase alphanumeric with optional hyphens between parts.', 400);
            }

            const organization: Organization = {
                uuid: crypto.randomUUID(),
                key: key,
                name: orgData.name,
                description: orgData.description,
                metadata: orgData.metadata || {}
            };

            logger.info('Creating organization:', { key, name: organization.name });

            // Store organization info
            const orgKey = `orgs:${key}:info`;
            logger.info(`Saving organization to Redis path: ${orgKey}`);
            await store.redis.setObject(orgKey, organization as unknown as Record<string, unknown>);

            // Publish organization created event
            logger.info('Publishing organization creation event');
            await store.redis.publish('organization:created', JSON.stringify(organization));

            logger.info(`Organization ${key} created successfully`);
            return organization;
        } catch (error) {
            logger.error('Failed to create organization:', {
                error: error instanceof Error ? error.message : String(error),
                key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to create organization', 500);
        }
    },

    /**
     * Gets an organization by its key
     * 
     * @param key - The organization key
     * @param store - Store containing Redis client
     * 
     * @throws Error if organization not found
     * 
     * @returns The organization data
     */
    getOrganization: async (key: string, store: { redis: RedisClient }): Promise<Organization> => {
        try {
            const orgKey = `orgs:${key}:info`;
            const orgData = await store.redis.getObject(orgKey);

            if (!orgData) {
                logger.error(`Organization not found: ${key}`);
                throw new ServerError('Organization not found', 404);
            }

            return orgData as Organization;
        } catch (error) {
            logger.error('Failed to get organization:', {
                error: error instanceof Error ? error.message : String(error),
                key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to get organization', 500);
        }
    },

    /**
     * Lists all organizations
     * 
     * @param store - Store containing Redis client
     * 
     * @returns Array of organizations
     */
    listOrganizations: async (store: { redis: RedisClient }): Promise<Organization[]> => {
        try {
            const orgKeys = await store.redis.keys('orgs:*:info');
            
            const organizations = await Promise.all(
                orgKeys.map(async (key) => {
                    const orgData = await store.redis.getObject(key);
                    return orgData as Organization | null;
                })
            );

            return organizations.filter((org): org is Organization => org !== null);
        } catch (error) {
            logger.error('Failed to list organizations:', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new ServerError('Failed to list organizations', 500);
        }
    },

    /**
     * Updates an organization
     * 
     * @param key - The organization key
     * @param orgData - The organization data to update
     * @param store - Store containing Redis client
     * 
     * @throws Error if organization not found
     * 
     * @returns The updated organization
     */
    updateOrganization: async (key: string, orgData: Partial<Organization>, store: { redis: RedisClient }): Promise<Organization> => {
        try {
            const existingOrg = await organizationController.getOrganization(key, store);

            const updatedOrg: Organization = {
                ...existingOrg,
                ...orgData,
                uuid: existingOrg.uuid, // Prevent UUID from being updated
                metadata: {
                    ...existingOrg.metadata,
                    ...(orgData.metadata || {})
                }
            };

            logger.info(`Updating organization: ${key}`);

            // Store updated organization
            const orgKey = `orgs:${key}:info`;
            await store.redis.setObject(orgKey, updatedOrg as unknown as Record<string, unknown>);

            // Publish organization updated event
            logger.info('Publishing organization update event');
            await store.redis.publish('organization:updated', JSON.stringify(updatedOrg));

            logger.info(`Organization ${key} updated successfully`);
            return updatedOrg;
        } catch (error) {
            logger.error('Failed to update organization:', {
                error: error instanceof Error ? error.message : String(error),
                key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to update organization', 500);
        }
    },

    /**
     * Deletes an organization
     * 
     * @param key - The organization key
     * @param store - Store containing Redis client
     * 
     * @throws Error if organization not found
     */
    deleteOrganization: async (key: string, store: { redis: RedisClient }): Promise<void> => {
        try {
            const orgKey = `orgs:${key}:info`;
            const orgData = await store.redis.getObject(orgKey);

            if (!orgData) {
                logger.error(`Organization not found: ${key}`);
                throw new ServerError('Organization not found', 404);
            }

            logger.info(`Deleting organization: ${key}`);

            // Delete organization
            await store.redis.del(orgKey);

            // Publish organization deleted event
            logger.info('Publishing organization deletion event');
            await store.redis.publish('organization:deleted', JSON.stringify({ key }));

            logger.info(`Organization ${key} deleted successfully`);
        } catch (error) {
            logger.error('Failed to delete organization:', {
                error: error instanceof Error ? error.message : String(error),
                key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to delete organization', 500);
        }
    }
};
