import { config } from 'dotenv';
import Redis from 'ioredis';
import { WebODMClient } from './clients/webodm';
import { MinioClient } from './clients/minio';
import { odmLogger, systemLogger } from './utils/logger';
import axios from 'axios';

// Load environment variables
config();

// Initialize clients
const redisSubscriber = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const webodm = new WebODMClient(
  process.env.WEBODM_HOST || 'http://localhost:8000',
  process.env.WEBODM_USERNAME || 'admin',
  process.env.WEBODM_PASSWORD || 'admin'
);

const minio = new MinioClient(
  process.env.MINIO_ENDPOINT || 'localhost:9000',
  process.env.MINIO_ACCESS_KEY || 'minioadmin',
  process.env.MINIO_SECRET_KEY || 'minioadmin',
  process.env.MINIO_BUCKET || 'skystore'
);

// Map to store project IDs and task IDs
const projectMap = new Map<string, number>(); // organization:project -> WebODM project ID
const missionTasks = new Map<string, { projectId: number; taskId: number }>(); // organization:project:mission -> WebODM task info

redisSubscriber.on('connect', async () => {
  systemLogger.info('Connected to Redis');
  
  try {
    await webodm.login();
    systemLogger.info('Authenticated with WebODM');

    // Subscribe to events
    await redisSubscriber.subscribe(
      'project_create',
      'mission_create',
      'mission_asset_uploaded'
    );

    systemLogger.info('Subscribed to events');
  } catch (error) {
    systemLogger.error('Failed to initialize', { error });
    process.exit(1);
  }
});

redisSubscriber.on('message', async (channel, message) => {
  systemLogger.debug('Received message', { channel, message });

  try {
    const data = JSON.parse(message);

    switch (channel) {
      case 'project_create': {
        await handleProjectCreate(data);
        break;
      }
      case 'mission_create': {
        await handleMissionCreate(data);
        break;
      }
      case 'mission_asset_uploaded': {
        await handleAssetUploaded(data);
        break;
      }
    }
  } catch (error) {
    systemLogger.error('Failed to process message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channel,
      message
    });
  }
});

// Handle project creation
async function handleProjectCreate(data: any) {
  try {
    const { organization, project, data: projectData } = data;
    const projectKey = `${organization}:${project}`;

    systemLogger.info('Creating new ODM project', { 
      organization,
      project,
      name: projectData.name
    });

    // Create WebODM project
    const odmProject = await webodm.createProject(
      projectData.name,
      projectData.description
    );

    // Store project ID mapping
    projectMap.set(projectKey, odmProject.id);

    // Store ODM project ID in Redis
    await redisClient.set(
      `org:${organization}:project:${project}:odm`,
      JSON.stringify({
        projectId: odmProject.id,
        key: project // Store the project key
      })
    );

    systemLogger.success('Created ODM project', {
      projectKey,
      odmProjectId: odmProject.id,
      projectMap: Object.fromEntries(projectMap)
    });
  } catch (error) {
    systemLogger.error('Failed to create ODM project', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
  }
}

// Handle mission creation
async function handleMissionCreate(data: any) {
  try {
    const { organization, project, mission, data: missionData } = data;
    const projectKey = `${organization}:${project}`;
    const missionKey = `${organization}:${project}:${mission}`;

    // First try to get project ID from Redis
    const odmProjectDataStr = await redisClient.get(`org:${organization}:project:${project}:odm`);
    let projectId = odmProjectDataStr ? JSON.parse(odmProjectDataStr).projectId : null;

    if (!projectId) {
      // Fallback to memory map
      projectId = projectMap.get(projectKey);
    }
    
    systemLogger.debug('Looking up project', {
      projectKey,
      projectId,
      projectMap: Object.fromEntries(projectMap)
    });

    if (!projectId) {
      // Try to create the project if it doesn't exist
      systemLogger.info('Project not found, creating it first', {
        organization,
        project
      });

      const odmProject = await webodm.createProject(
        `${organization}/${project}`,
        'Auto-created project'
      );

      projectId = odmProject.id;
      projectMap.set(projectKey, projectId);

      // Store in Redis
      await redisClient.set(
        `org:${organization}:project:${project}:odm`,
        JSON.stringify({
          projectId: odmProject.id,
          key: project
        })
      );

      systemLogger.success('Created missing ODM project', {
        projectKey,
        odmProjectId: odmProject.id
      });
    }

    systemLogger.info('Creating new ODM task for mission', { 
      organization,
      project,
      mission,
      name: missionData.name,
      projectId
    });

    // Format options as array of name/value pairs for WebODM
    const options = [
      { name: 'auto-boundary', value: 'true' },
      { name: 'feature-quality', value: 'high' },
      { name: 'mesh-octree-depth', value: '11' },
      { name: 'mesh-size', value: '300000' },
      { name: 'min-num-features', value: '10000' },
      { name: 'pc-quality', value: 'high' },
      { name: 'use-3dmesh', value: 'true' },
      // Add mission-specific options
      { name: 'gsd', value: missionData.metadata?.ground_resolution?.toString() || '2.5' },
      { name: 'orthophoto-resolution', value: missionData.metadata?.ground_resolution?.toString() || '2.5' },
      { name: 'ignore-gsd', value: 'false' },
      { name: 'dsm', value: 'true' },
      { name: 'dtm', value: 'true' },
      { name: 'dem-resolution', value: missionData.metadata?.ground_resolution?.toString() || '2.5' },
      // Add mission metadata as options
      { name: 'altitude', value: missionData.metadata?.altitude?.toString() || '100' },
      { name: 'overlap', value: missionData.metadata?.overlap_percent?.toString() || '75' },
      { name: 'sidelap', value: missionData.metadata?.sidelap_percent?.toString() || '60' }
    ];

    // Create form data for task creation
    const formData = new FormData();
    formData.append('name', missionData.name);
    
    // Add options as a JSON string
    formData.append('options', JSON.stringify(options));
    
    // Create an empty file to satisfy the API requirement
    const emptyBlob = new Blob([''], { type: 'text/plain' });
    formData.append('images', emptyBlob, 'placeholder.txt');

    // Create WebODM task
    const task = await webodm.createTask(projectId, formData);

    // Store task ID mapping
    missionTasks.set(missionKey, {
      projectId,
      taskId: task.id
    });

    // Store ODM task info in Redis
    await redisClient.set(
      `org:${organization}:project:${project}:mission:${mission}:odm`,
      JSON.stringify({
        projectId,
        taskId: task.id,
        key: mission // Store the mission key
      })
    );

    systemLogger.success('Created ODM task for mission', {
      missionKey,
      taskId: task.id,
      projectId
    });
  } catch (error) {
    systemLogger.error('Failed to create ODM task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
  }
}

// Handle asset upload
async function handleAssetUploaded(data: any) {
  try {
    const { organization, project, mission, asset } = data;
    const missionKey = `${organization}:${project}:${mission}`;

    odmLogger.info('New asset uploaded', { 
      organization,
      project,
      mission,
      asset 
    });

    // Get task info
    const taskInfo = missionTasks.get(missionKey);
    if (!taskInfo) {
      throw new Error('No ODM task found for mission');
    }

    // Get presigned URL for the asset
    const presignedUrl = await minio.getPresignedUrl(asset.path);

    // Download the image from MinIO
    const imageResponse = await axios.get(presignedUrl, {
      responseType: 'arraybuffer'
    });

    // Create form data with the image for asset upload
    const formData = new FormData();
    const blob = new Blob([imageResponse.data], { type: 'image/jpeg' });
    formData.append('images', blob, asset.name);

    // Upload the image to the ODM task
    await webodm.uploadTaskImage(taskInfo.taskId, formData);

    odmLogger.success('Asset uploaded to ODM task', {
      missionKey,
      taskId: taskInfo.taskId,
      asset: asset.name
    });

  } catch (error) {
    odmLogger.error('Failed to handle asset upload', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  systemLogger.info('Shutting down...');
  await Promise.all([
    redisSubscriber.quit(),
    redisClient.quit()
  ]);
  process.exit(0);
});

systemLogger.info('ODM Bridge started');