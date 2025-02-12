import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Organization {
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export interface Project {
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export interface Mission {
  name: string;
  mission: string;
  location: string;
  date: string;
  metadata: {
    telescope: string;
    target: string;
    exposure_time: string;
    weather_conditions: string;
    observer: string;
    priority: string;
  };
}

export interface CreateMissionPayload {
  organization: string;
  project: string;
  mission: string;
  name: string;
  location: string;
  date: string;
  metadata: {
    telescope: string;
    target: string;
    exposure_time: string;
    weather_conditions: string;
    observer: string;
    priority: string;
  };
}

export interface Asset {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  path: string;
  uploadedAt: string;
  presignedUrl: string;
  directUrl: string;
  thumbnailUrl?: string;
}

export const apiClient = {
  // Organization endpoints
  createOrganization: async (organization: string, data: Organization) => {
    return api.post(`/org/${organization}`, data);
  },

  getOrganization: async (organization: string) => {
    const response = await api.get<{ data: Organization }>(`/org/${organization}`);
    return response.data.data;
  },

  listOrganizations: async () => {
    const response = await api.get<{ data: Organization[] }>('/orgs');
    return response.data.data;
  },

  updateOrganization: async (organization: string, data: Partial<Organization>) => {
    const response = await api.patch<{ data: Organization }>(`/org/${organization}`, data);
    return response.data.data;
  },

  deleteOrganization: async (organization: string) => {
    return api.delete(`/org/${organization}`);
  },

  // Project endpoints
  createProject: async (organization: string, project: string, data: Project) => {
    return api.post(`/org/${organization}/project/${project}`, data);
  },

  getProject: async (organization: string, project: string) => {
    const response = await api.get<{ data: Project }>(`/org/${organization}/project/${project}`);
    return response.data.data;
  },

  listProjects: async (organization: string) => {
    const response = await api.get<{ data: Project[] }>(`/org/${organization}/projects`);
    return response.data.data;
  },

  updateProject: async (organization: string, project: string, data: Partial<Project>) => {
    const response = await api.patch<{ data: Project }>(`/org/${organization}/project/${project}`, data);
    return response.data.data;
  },

  deleteProject: async (organization: string, project: string) => {
    return api.delete(`/org/${organization}/project/${project}`);
  },

  // Mission endpoints
  createMission: async (payload: CreateMissionPayload) => {
    const { organization, project, mission, ...data } = payload;
    return api.post(
      `/org/${organization}/project/${project}/mission/${mission}`,
      data
    );
  },

  listMissions: async (organization: string, project: string) => {
    const response = await api.get<{ data: Mission[] }>(
      `/org/${organization}/project/${project}/missions`
    );
    return response.data.data;
  },

  getMission: async (organization: string, project: string, mission: string) => {
    const response = await api.get<{ data: Mission }>(
      `/org/${organization}/project/${project}/mission/${mission}`
    );
    return response.data.data;
  },

  updateMission: async (organization: string, project: string, mission: string, data: Partial<Mission>) => {
    const response = await api.patch<{ data: Mission }>(
      `/org/${organization}/project/${project}/mission/${mission}`,
      data
    );
    return response.data.data;
  },

  // Asset endpoints
  uploadAsset: async (organization: string, project: string, mission: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(
      `/org/${organization}/project/${project}/mission/${mission}/assets/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  getMissionAssets: async (organization: string, project: string, mission: string) => {
    const response = await api.get<{ data: Asset[] }>(
      `/org/${organization}/project/${project}/mission/${mission}/assets`
    );
    return response.data.data;
  },

  getAsset: async (organization: string, project: string, mission: string, assetId: string) => {
    const response = await api.get<{ data: Asset }>(
      `/org/${organization}/project/${project}/mission/${mission}/assets/${assetId}`
    );
    return response.data.data;
  },

  getThumbnailUrl: (organization: string, project: string, mission: string, assetId: string) => {
    return `${api.defaults.baseURL}/org/${organization}/project/${project}/mission/${mission}/assets/${assetId}/thumbnail`;
  },
}; 