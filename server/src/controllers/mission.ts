import { CreateMissionBody, CreateMissionParams, Mission } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";
import logger from "../logger";
import { ServerError } from "../types/ServerError";

/**
 * Controller for managing missions in Redis
 */
export const missionController = {
    /**
     * Creates a new mission
     * 
     * @param params - Parameters for creating the mission
     * @param missionData - The mission data to create
     * @param store - Store containing Redis client
     * 
     * @throws Error if required fields are missing or invalid
     * 
     * Storage in Redis:
     * - Mission info: `orgs:${params.organization_key}:projects:${params.project_key}:missions:${params.mission_key}:info`
     * 
     * Events published:
     * - `mission:created` - When mission is successfully created
     * 
     * @returns The created mission
     */
    createMission: async (params: CreateMissionParams, missionData: CreateMissionBody, store: { redis: RedisClient }): Promise<Mission> => {
        try {
            // Validate required fields
            const requiredFields = ['name', 'location', 'date'];
            for (const field of requiredFields) {
                if (!missionData[field as keyof CreateMissionBody]) {
                    logger.error(`${field} is required`);
                    throw new ServerError(`${field} is required`, 400);
                }
            }

            // Validate required params
            if (!params.organization_key || !params.project_key || !params.mission_key) {
                logger.error('Missing required parameters');
                throw new ServerError('Missing required parameters: organization_key, project_key, mission_key', 400);
            }

            const mission: Mission = {
                uuid: crypto.randomUUID(),
                key: params.mission_key,
                name: missionData.name,
                location: missionData.location,
                date: missionData.date,
                metadata: missionData.metadata || {}
            };

            logger.info('Creating mission:', { 
                organization: params.organization_key,
                project: params.project_key,
                mission: params.mission_key,
                name: mission.name 
            });

            // Store mission info
            const missionKey = `orgs:${params.organization_key}:projects:${params.project_key}:missions:${params.mission_key}:info`;
            logger.info(`Saving mission to Redis path: ${missionKey}`);
            await store.redis.setObject(missionKey, mission as unknown as Record<string, unknown>);

            // Publish mission created event
            logger.info('Publishing mission creation event');
            await store.redis.publish('mission:created', JSON.stringify({ ...mission, ...params }));

            logger.info(`Mission ${params.mission_key} created successfully`);
            return mission;
        } catch (error) {
            logger.error('Failed to create mission:', {
                error: error instanceof Error ? error.message : String(error),
                organization: params.organization_key,
                project: params.project_key,
                mission: params.mission_key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to create mission', 500);
        }
    },

    /**
     * Gets a mission by its key
     * 
     * @param params - Parameters for identifying the mission
     * @param store - Store containing Redis client
     * 
     * @throws Error if mission not found
     * 
     * @returns The mission data
     */
    getMission: async (params: CreateMissionParams, store: { redis: RedisClient }): Promise<Mission> => {
        try {
            const missionKey = `orgs:${params.organization_key}:projects:${params.project_key}:missions:${params.mission_key}:info`;
            const missionData = await store.redis.getObject(missionKey);

            if (!missionData) {
                logger.error(`Mission not found: ${params.mission_key}`);
                throw new ServerError('Mission not found', 404);
            }

            return missionData as Mission;
        } catch (error) {
            logger.error('Failed to get mission:', {
                error: error instanceof Error ? error.message : String(error),
                organization: params.organization_key,
                project: params.project_key,
                mission: params.mission_key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to get mission', 500);
        }
    },

    /**
     * Lists all missions for a project
     * 
     * @param organizationKey - The organization key
     * @param projectKey - The project key
     * @param store - Store containing Redis client
     * 
     * @returns Array of missions
     */
    listMissions: async (organizationKey: string, projectKey: string, store: { redis: RedisClient }): Promise<Mission[]> => {
        try {
            const missionKeys = await store.redis.keys(`orgs:${organizationKey}:projects:${projectKey}:missions:*:info`);
            
            const missions = await Promise.all(
                missionKeys.map(async (key) => {
                    const missionData = await store.redis.getObject(key);
                    return missionData as Mission | null;
                })
            );

            return missions.filter((mission): mission is Mission => mission !== null);
        } catch (error) {
            logger.error('Failed to list missions:', {
                error: error instanceof Error ? error.message : String(error),
                organization: organizationKey,
                project: projectKey
            });
            throw new ServerError('Failed to list missions', 500);
        }
    },

    /**
     * Updates a mission's metadata
     * 
     * @param params - Parameters for identifying the mission
     * @param metadata - New metadata to merge with existing
     * @param store - Store containing Redis client
     * 
     * @throws Error if mission not found
     * 
     * @returns The updated mission
     */
    updateMissionMetadata: async (params: CreateMissionParams, metadata: Record<string, string>, store: { redis: RedisClient }): Promise<Mission> => {
        try {
            const mission = await missionController.getMission(params, store);

            const updatedMission: Mission = {
                ...mission,
                metadata: {
                    ...mission.metadata,
                    ...metadata
                }
            };

            logger.info(`Updating mission metadata: ${params.mission_key}`);

            const missionKey = `orgs:${params.organization_key}:projects:${params.project_key}:missions:${params.mission_key}:info`;
            await store.redis.setObject(missionKey, updatedMission as unknown as Record<string, unknown>);

            // Publish mission updated event
            logger.info('Publishing mission update event');
            await store.redis.publish('mission:updated', JSON.stringify({ ...updatedMission, ...params }));

            logger.info(`Mission ${params.mission_key} metadata updated successfully`);
            return updatedMission;
        } catch (error) {
            logger.error('Failed to update mission metadata:', {
                error: error instanceof Error ? error.message : String(error),
                organization: params.organization_key,
                project: params.project_key,
                mission: params.mission_key
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to update mission metadata', 500);
        }
    }
}; 