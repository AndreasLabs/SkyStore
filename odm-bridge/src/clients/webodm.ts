import axios from 'axios';
import type { AxiosInstance } from 'axios';
import adze from 'adze';

// Create a logger instance for WebODM client
const logger = adze.namespace('WebODM').seal();

export interface TaskOptions {
  name?: string;
  options?: {
    // ODM options from mission metadata
    altitude?: number;
    overlap?: number;
    sidelap?: number;
    gsd?: number; // ground sampling distance (resolution)
    [key: string]: any;
  };
  webhook?: string;
  skipPostProcessing?: boolean;
  outputs?: string[];
  dateCreated?: number;
}

export interface Task {
  id: number;
  project: number;
  processing_node: number;
  images_count: number;
  available_assets: string[];
  uuid: string;
  name: string;
  status: {
    code: number; // 10 = QUEUED, 20 = RUNNING, 30 = FAILED, 40 = COMPLETED, 50 = CANCELED
  };
  progress: number;
  options: TaskOptions['options'];
  created_at: string;
  pending_action: string | null;
}

export interface Project {
  id: number;
  tasks: number[];
  created_at: string;
  name: string;
  description: string;
  permissions: string[];
}

export class WebODMClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(
    private host: string,
    private username: string,
    private password: string
  ) {
    logger.info('Initializing WebODM client', { host });
    
    this.client = axios.create({
      baseURL: host,
    });
  }

  async login(): Promise<void> {
    logger.info('Authenticating with WebODM server...');
    try {
      const response = await this.client.post('/api/token-auth/', {
        username: this.username,
        password: this.password
      });

      if (!response.data?.token) {
        throw new Error('No token received from server');
      }

      this.token = response.data.token;
      
      // Add token to all future requests
      this.client.defaults.headers.common['Authorization'] = `JWT ${this.token}`;
      
      logger.success('Successfully authenticated with WebODM');
    } catch (error) {
      logger.error('Failed to authenticate with WebODM', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createProject(name: string, description: string = ''): Promise<Project> {
    logger.info('Creating new project', { name });
    try {
      const response = await this.client.post('/api/projects/', {
        name,
        description
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to create project', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async createTask(projectId: number, formData: FormData): Promise<Task> {
    logger.info('Creating new task', { projectId });
    
    try {
      // Step 1: Initialize task
      const initResponse = await this.client.post(
        `/api/projects/${projectId}/tasks/new/init/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const taskUuid = initResponse.data.uuid;
      logger.info('Task initialized', { taskUuid });

      // Step 2: Upload placeholder image
      const uploadResponse = await this.client.post(
        `/api/projects/${projectId}/tasks/new/upload/${taskUuid}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Step 3: Commit the task
      const commitResponse = await this.client.post(
        `/api/projects/${projectId}/tasks/new/commit/${taskUuid}/`
      );

      return commitResponse.data;
    } catch (error) {
      logger.error('Failed to create task', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async uploadTaskImage(taskId: number, formData: FormData): Promise<void> {
    logger.debug('Uploading image to task', { taskId });
    try {
      const response = await this.client.post(
        `/api/projects/tasks/${taskId}/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data?.success) {
        logger.error('Failed to upload image', { 
          taskId,
          response: response.data 
        });
        throw new Error('Failed to upload image');
      }

      logger.success('Successfully uploaded image', { taskId });
    } catch (error) {
      logger.error('Failed to upload image', { taskId, error });
      throw error;
    }
  }

  async getTask(projectId: number, taskId: number): Promise<Task> {
    logger.debug('Fetching task status', { projectId, taskId });
    try {
      const response = await this.client.get(`/api/projects/${projectId}/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch task status', { projectId, taskId, error });
      throw error;
    }
  }

  async getTaskOutput(projectId: number, taskId: number): Promise<string[]> {
    logger.debug('Fetching task output', { projectId, taskId });
    try {
      const response = await this.client.get(`/api/projects/${projectId}/tasks/${taskId}/output/`);
      return response.data.output;
    } catch (error) {
      logger.error('Failed to fetch task output', { projectId, taskId, error });
      throw error;
    }
  }

  async cancelTask(projectId: number, taskId: number): Promise<void> {
    logger.info('Cancelling task', { projectId, taskId });
    try {
      await this.client.post(`/api/projects/${projectId}/tasks/${taskId}/cancel/`);
      logger.success('Successfully cancelled task', { projectId, taskId });
    } catch (error) {
      logger.error('Failed to cancel task', { projectId, taskId, error });
      throw error;
    }
  }

  async removeTask(projectId: number, taskId: number): Promise<void> {
    logger.info('Removing task', { projectId, taskId });
    try {
      await this.client.delete(`/api/projects/${projectId}/tasks/${taskId}/`);
      logger.success('Successfully removed task', { projectId, taskId });
    } catch (error) {
      logger.error('Failed to remove task', { projectId, taskId, error });
      throw error;
    }
  }

  async downloadOutput(projectId: number, taskId: number, asset: string): Promise<string> {
    logger.info('Downloading task output', { projectId, taskId, asset });
    try {
      const response = await this.client.get(
        `/api/projects/${projectId}/tasks/${taskId}/download/${asset}`,
        { responseType: 'blob' }
      );
      logger.success('Successfully downloaded task output', { projectId, taskId, asset });
      return URL.createObjectURL(response.data);
    } catch (error) {
      logger.error('Failed to download task output', { projectId, taskId, asset, error });
      throw error;
    }
  }
}