import { systemLogger } from '../utils/logger';

export interface NodeODMOptions {
  name?: string;
  options?: string[];
  outputs?: string[];
  token?: string;
  webhook?: string;
}

export interface NodeODMTask {
  uuid: string;
  name: string;
  dateCreated: string;
  
  processingTime: number;
  status: {
    code: number;
    status: string;
  };
  options: string[];
  imagesCount: number;
  progress: number;
}

class NodeODMClient {
  private baseUrl: string;

  constructor() {
    const nodeOdmUrl = process.env.NODEODM_URL;
    if (!nodeOdmUrl) {
      throw new Error('NODEODM_URL environment variable is not set');
    }
    this.baseUrl = nodeOdmUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`NodeODM API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      systemLogger.error('NodeODM request failed', { error, endpoint });
      throw error;
    }
  }

  async getInfo(): Promise<any> {
    return this.request('/info');
  }

  async createTask(images: File[], options: NodeODMOptions = {}): Promise<NodeODMTask> {
    const formData = new FormData();
    
    // Add images
    images.forEach((image) => {
      formData.append('images', image);
    });

    // Add options
    if (options.name) formData.append('name', options.name);
    if (options.options) formData.append('options', JSON.stringify(options.options));
    if (options.outputs) formData.append('outputs', JSON.stringify(options.outputs));
    if (options.webhook) formData.append('webhook', options.webhook);
    if (options.token) formData.append('token', options.token);

    const response = await fetch(`${this.baseUrl}/task/new`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create NodeODM task: ${response.statusText}`);
    }

    return response.json();
  }

  async getTask(taskId: string): Promise<NodeODMTask> {
    return this.request(`/task/${taskId}/info`);
  }

  async getTaskOutput(taskId: string, type: string): Promise<any> {
    return this.request(`/task/${taskId}/download/${type}`);
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.request(`/task/${taskId}/cancel`, { method: 'POST' });
  }

  async removeTask(taskId: string): Promise<void> {
    await this.request(`/task/${taskId}/remove`, { method: 'POST' });
  }

  async listTasks(): Promise<NodeODMTask[]> {
    return this.request('/task/list');
  }
}

export const nodeOdmClient = new NodeODMClient(); 