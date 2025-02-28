import { CreateProjectBody, UpdateProjectBody } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";
import logger from "../logger";
import { ServerError } from "../types/ServerError";
/**
 * Verifies that a project key is valid
 * Must be lowercase alphanumeric with optional dashes between parts
 * Examples: "my-project", "my-cool-project", "my-cool-project-2"
 */
const verifyProjectKey = (key: string): boolean => {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key);
}


/**
 * Controller for managing projects in Redis
 */
export const projectController = {
    /**
     * Creates a new project
     * 
     * @param project - The project data to create
     * @param store - Store containing Redis client
     * 
     * @throws Error if required fields are missing or invalid
     * @throws Error if project/organization keys are invalid format
     * 
     * Storage in Redis:
     * - Project info: `orgs:${project.organization_key}:projects:${project.key}:info`
     * - Project metadata: `orgs:${project.organization_key}:projects:${project.key}:metadata`
     * 
     * Events published:
     * - `project:event_created` - When project is successfully created
     * 
     * @returns The created project
     */
    createProject: async (project: CreateProjectBody, store: { redis: RedisClient }) => {
        // Validate required fields
        const requiredFields = ['key', 'name', 'owner_uuid', 'organization_uuid', 'organization_key'];
        for (const field of requiredFields) {
            if (!project[field as keyof CreateProjectBody]) {
                logger.error(`${field} is required`);
                throw new ServerError(`${field} is required`, 400);
            }
        }

        // Validate project and org keys
        if (!verifyProjectKey(project.key || '')) {
            logger.error('Invalid project key, must be alphanumeric and have no spaces and only dashes');
            throw new ServerError('Invalid project key, must be alphanumeric and have no spaces and only dashes', 400);
        }

        if (!verifyProjectKey(project.organization_key || '')) {
            logger.error('Invalid organization key, must be alphanumeric and have no spaces and only dashes');
            throw new ServerError('Invalid organization key, must be alphanumeric and have no spaces and only dashes', 400);
        }

        // Set required system fields
        project.uuid = crypto.randomUUID();
        project.createdAt = new Date();
        project.updatedAt = new Date();
        
        // Set defaults for optional fields
        if (!project.description) {
            project.description = "No description provided";
            logger.warn('No description provided, setting to "No description provided"');
        }

        if (!project.metadata) {
            project.metadata = {};
            logger.warn('No metadata provided, setting to empty object');
        }

        logger.info('Creating project:', project);

        // Save to Redis
        const redisPath = `orgs:${project.organization_key}:projects:${project.key}`;
        const { metadata, ...info } = project;
        
        try {
            logger.info(`Saving project info to Redis path: ${redisPath}:info`);
            await store.redis.setObject(`${redisPath}:info`, info);
            
            logger.info(`Saving project metadata to Redis path: ${redisPath}:metadata`);
            await store.redis.setObject(`${redisPath}:metadata`, metadata);

            // Publish creation event
            logger.info('Publishing project creation event');
            await store.redis.publish(`project:event_created`, JSON.stringify(project));

            // Add the project key to the organization's projects set
            await store.redis.sadd(`orgs:${project.organization_key}:projects:members`, project.key);

            logger.info(`Project ${project.key} saved successfully for organization ${project.organization_key}`);
            return project;
        } catch (error) {
            logger.error('Failed to save project to Redis:', {
                error: error instanceof Error ? error.message : String(error),
                project_key: project.key,
                organization_key: project.organization_key,
                redis_path: redisPath
            });
            throw error;
        }
    },

    /**
     * Retrieves a project by its organization and project keys
     * 
     * @param organizationKey - The organization's key
     * @param projectKey - The project's key
     * @param store - Store containing Redis client
     * 
     * @throws Error if project is not found
     * @returns The requested project with its metadata
     */
    getProjectByKey: async (organizationKey: string, projectKey: string, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;
        const info = await store.redis.getObject(`${redisPath}:info`);
        const metadata = await store.redis.getObject(`${redisPath}:metadata`);

        if (!info) {
            throw new ServerError('Project not found', 404);
        }

        return {
            ...info,
            metadata: metadata || {}
        };
    },

    /**
     * Lists all projects for an organization
     * 
     * @param organizationKey - The organization's key
     * @param store - Store containing Redis client
     * @returns Array of projects or null if none exist
     */
    listProjectsByOrganizationKey: async (organizationKey: string, store: { redis: RedisClient }) => {
        try {
            // Get all the projects for the organization
            const redisPath = `orgs:${organizationKey}:projects`;
            const projectKeys = await store.redis.smembers(`${redisPath}:members`);
            console.log('projectKeys', projectKeys);
            if (projectKeys.length === 0) {
                logger.info(`No projects found for organization ${organizationKey}`);
                return { projects: [] };
            }

            // Get the info for each project
            const projects = await Promise.all(projectKeys.map(async (key) => {
                const project = await store.redis.getObject(`${redisPath}:${key}:info`);
                return project;
            }));    
            return projects;
        } catch (error) {
            logger.error('Failed to list projects:', {
                error: error instanceof Error ? error.message : String(error),
                organization_key: organizationKey
            });
            throw new ServerError('Failed to list projects', 500);
        }
    },

    /**
     * Updates an existing project
     * 
     * @param organizationKey - The organization's key
     * @param projectKey - The project's key
     * @param project - The updated project data
     * @param store - Store containing Redis client
     * 
     * Events published:
     * - `orgs:${organizationKey}:projects:${projectKey}:event_updated`
     * 
     * @returns The updated project
     */
    updateProject: async (organizationKey: string, projectKey: string, project: UpdateProjectBody, store: { redis: RedisClient }) => {
        try {
            const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;

            // Verify project exists before updating
            const exists = await store.redis.get(`${redisPath}:info`);
            if (!exists) {
                logger.error('Project not found');
                throw new ServerError('Project not found', 404);
            }

            const { metadata, ...info } = project;

            // Update project info and metadata
            await store.redis.setObject(`${redisPath}:info`, info);
            if (metadata) {
                logger.info('Updating project metadata');
                await store.redis.setObject(`${redisPath}:metadata`, metadata);
            }

            // Publish update event
            logger.info('Publishing project update event');
            await store.redis.publish(`project:event_updated`, JSON.stringify({
                organization_key: organizationKey,
                project_key: projectKey,
                ...project
            }));

            return project;
        } catch (error) {
            logger.error('Failed to update project:', {
                error: error instanceof Error ? error.message : String(error),
                organization_key: organizationKey,
                project_key: projectKey
            });
            
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to update project', 500);
        }
    },

    /**
     * Deletes a project
     * 
     * @param organizationKey - The organization's key
     * @param projectKey - The project's key
     * @param store - Store containing Redis client
     * 
     * Events published:
     * - `orgs:${organizationKey}:projects:${projectKey}:event_deleted`
     */
    deleteProject: async (organizationKey: string, projectKey: string, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;
        await store.redis.del(redisPath);

        await store.redis.publish(`project:event_deleted`, JSON.stringify({
            organization_key: organizationKey,
            project_key: projectKey
        }));
    }
};