import { CreateTaskParams, Task } from "@skystore/core_types";
import { RedisClient } from "../clients/RedisClient";
import logger from "../logger";
import { ServerError } from "../types/ServerError";

/**
 * Controller for managing tasks in Redis
 */
export const taskController = {
    /**
     * Creates a new task
     * 
     * @param task - The task data to create
     * @param store - Store containing Redis client
     * 
     * @throws Error if required fields are missing or invalid
     * 
     * Storage in Redis:
     * - Task info: `missions:${task.mission_id}:tasks:${task.uuid}:info`
     * - Task status: `missions:${task.mission_id}:tasks:${task.uuid}:status`
     * 
     * Events published:
     * - `task:created` - When task is successfully created
     * 
     * @returns The created task
     */
    createTask: async (taskParams: CreateTaskParams, store: { redis: RedisClient }): Promise<Task> => {
        // Validate required fields
        const requiredFields = ['name', 'mission_key', 'status'];
        for (const field of requiredFields) {
            if (!taskParams[field as keyof CreateTaskParams]) {
                logger.error(`${field} is required`);
                throw new ServerError(`${field} is required`, 400);
            }
        }

        const taskUuid = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const task: Task = {
            uuid: taskUuid,
            key: taskParams.key,
            name: taskParams.name,
            description: taskParams.description,
            status: taskParams.status,
            processor: 'odm',
            organization_key: '', // Will be populated from mission data
            project_key: '', // Will be populated from mission data
            mission_key: taskParams.mission_key,
            asset_ids: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: 0,
            error: null,
            imagesCount: 0,
            processingTime: 0,
            options: [],
            messages: []
        };

        // Store task info
        const taskKey = `missions:${task.mission_key}:tasks:${task.uuid}:info`;
        await store.redis.set(taskKey, JSON.stringify(task));

        // Publish task created event
        await store.redis.publish('task:created', JSON.stringify(task));

        return task;
    },

    /**
     * Gets all tasks for a specific mission
     * 
     * @param missionId - The ID of the mission
     * @param store - Store containing Redis client
     * 
     * @returns Array of tasks for the mission
     */
    getTasksForMission: async (missionId: string, store: { redis: RedisClient }): Promise<Task[]> => {
        if (!missionId) {
            throw new ServerError('Mission ID is required', 400);
        }

        // Get all task keys for the mission
        const taskKeys = await store.redis.keys(`missions:${missionId}:tasks:*:info`);
        
        // Get all tasks
        const tasks = await Promise.all(
            taskKeys.map(async (key) => {
                const taskData = await store.redis.get(key);
                return taskData ? JSON.parse(taskData) as Task : null;
            })
        );

        // Filter out any null values and return tasks
        return tasks.filter((task): task is Task => task !== null);
    },

    /**
     * Cancels a task
     * 
     * @param taskId - The ID of the task to cancel
     * @param missionId - The ID of the mission the task belongs to
     * @param store - Store containing Redis client
     * 
     * @throws Error if task not found
     * 
     * Events published:
     * - `task:cancelled` - When task is successfully cancelled
     * 
     * @returns The updated task
     */
    cancelTask: async (taskId: string, missionId: string, store: { redis: RedisClient }): Promise<Task> => {
        if (!taskId || !missionId) {
            throw new ServerError('Task ID and Mission ID are required', 400);
        }

        const taskKey = `missions:${missionId}:tasks:${taskId}:info`;
        const taskData = await store.redis.get(taskKey);

        if (!taskData) {
            throw new ServerError('Task not found', 404);
        }

        const task = JSON.parse(taskData) as Task;

        // Only allow cancellation of pending or in_progress tasks
        if (task.status !== 'pending' && task.status !== 'in_progress') {
            throw new ServerError('Can only cancel pending or in-progress tasks', 400);
        }

        // Update task status
        task.status = 'failed';
        task.error = 'Task cancelled by user';
        task.updatedAt = new Date().toISOString();

        // Save updated task
        await store.redis.set(taskKey, JSON.stringify(task));

        // Publish task cancelled event
        await store.redis.publish('task:cancelled', JSON.stringify(task));

        return task;
    }
}; 