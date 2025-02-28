export interface TaskOption {
  name: string;
  value: string | number | boolean;
}

export interface Task {
  uuid: string;
  key: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  processor: 'odm';
  organization_key: string;
  project_key: string;
  mission_key: string;
  asset_ids: string[];
  createdAt: string;
  updatedAt: string;
  progress: number;
  error: string | null;
  imagesCount: number;
  processingTime: number;
  options: TaskOption[];
  messages: string[];
}

export interface CreateTaskParams {
  name: string;
  key: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  mission_key: string;
}