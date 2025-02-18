import { CreateProjectBody } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";

import logger from "../logger";
const verifyProjectKey = (key: string) => {
    // Check if key is alphanumeric and has no spaces and is to-lowercases, only dashses
    // Example: valid keys: "my-project", "my-cool-project", "my-cool-project-2"
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key);
}


export const projectController = {
    createProject: async (project: CreateProjectBody, store: { redis: RedisClient })  => {
        // Defined required fields
        const requiredFields = ['key', 'name', 'owner_uuid', 'organization_uuid', 'organization_key'];
        for (const field of requiredFields) {
            if (!project[field as keyof CreateProjectBody]) {
                logger.error(`${field} is required`);
                throw new Error(`${field} is required`);
            }
        }

        if (!verifyProjectKey(project.key)) {
            logger.error('Invalid project key, must be alphanumeric and have no spaces and only dashes');
            throw new Error('Invalid project key, must be alphanumeric and have no spaces and only dashes');
        }

        //TODO: Use a organization-key specific function to check if the organization exists
        if (!verifyProjectKey(project.organization_key)) {
            logger.error('Invalid organization key, must be alphanumeric and have no spaces and only dashes');
            throw new Error('Invalid organization key, must be alphanumeric and have no spaces and only dashes');
        }

        // Generate a uuid for the project
        const uuid = crypto.randomUUID();
        project.uuid = uuid;

        // Generate a createdAt date
        const createdAt = new Date();
        project.createdAt = createdAt;

        // Generate a updatedAt date
        const updatedAt = new Date();
        project.updatedAt = updatedAt;
        
        // If no description is provided, set it to "No description provided"
        if (!project.description) {
            project.description = "No description provided";
            logger.warn('No description provided, setting to "No description provided"');
        }

        // If no metadata is provided, set it to an empty object
        if (!project.metadata) {
            project.metadata = {};
            logger.warn('No metadata provided, setting to an empty object');
        }
        logger.info('Project: ', project);

        const redisPath = `orgs:${project.organization_key}:projects:${project.key}`;
        const infoPath = `${redisPath}:info`;
        const metadataPath = `${redisPath}:metadata`;

        // Save the project to Redis    
        // Info is everything except metadata
        const { metadata, ...info } = project;
        await store.redis.setObject(infoPath, info);
        await store.redis.setObject(metadataPath, metadata);

        logger.info('Project saved to Redis');

        return project;
    },
    getProjectByKey: async (organizationKey: string, projectKey: string, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;
        const infoPath = `${redisPath}:info`;
        const metadataPath = `${redisPath}:metadata`;

        // Get project info and metadata from Redis
        const info = await store.redis.getObject(infoPath);
        const metadata = await store.redis.getObject(metadataPath);

        if (!info) {
            throw new Error('Project not found');
        }

        // Combine info and metadata
        const project = {
            ...info,
            metadata: metadata || {}
        };

        return project;
    },
    listProjectsByOrganizationKey: async (organizationKey: string, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects`;
        const projects = await store.redis.getObject(redisPath);
        return projects;
    },
    updateProject: async (organizationKey: string, projectKey: string, project: UpdateProjectBody, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;
        const infoPath = `${redisPath}:info`;
        const metadataPath = `${redisPath}:metadata`;

        await store.redis.setObject(infoPath, project);
        await store.redis.setObject(metadataPath, project.metadata);

        return project;
    },
    deleteProject: async (organizationKey: string, projectKey: string, store: { redis: RedisClient }) => {
        const redisPath = `orgs:${organizationKey}:projects:${projectKey}`;
        await store.redis.del(redisPath);
    }
};