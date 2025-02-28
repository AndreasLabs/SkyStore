import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Project, CreateProjectBody, UpdateProjectBody, RestResult } from '@skystore/core_types';
import { axiosInstance, apiCall, safeApiCall } from '../api/apiClient';

// Query keys for projects
const projectKeys = {
  all: ['projects'] as const,
  lists: (orgKey: string) => [...projectKeys.all, 'list', orgKey] as const,
  detail: (orgKey: string, projectKey: string) => [...projectKeys.all, 'detail', orgKey, projectKey] as const,
};

// API calls integrated into hooks
const listProjects = async (orgKey: string): Promise<RestResult<Project[]>> => {
  if (!orgKey) {
    return {
      http_status: 400,
      success: false,
      message: 'Organization key is required',
      content: []
    };
  }
  return apiCall(axiosInstance.get(`/org/${orgKey}/projects`));
};

const getProject = async (orgKey: string, projectKey: string): Promise<RestResult<Project>> => {
  if (!orgKey || !projectKey) {
    return {
      http_status: 400,
      success: false,
      message: 'Organization key and project key are required',
      content: null
    };
  }
  return apiCall(axiosInstance.get(`/org/${orgKey}/projects/${projectKey}`));
};

const createProject = async (orgKey: string, projectKey: string, data: CreateProjectBody): Promise<RestResult<Project>> => {
  if (!orgKey || !projectKey) {
    return {
      http_status: 400,
      success: false,
      message: 'Organization key and project key are required',
      content: null
    };
  }
  return apiCall(axiosInstance.post(`/org/${orgKey}/projects/${projectKey}`, data));
};

const updateProject = async (orgKey: string, projectKey: string, data: UpdateProjectBody): Promise<RestResult<Project>> => {
  if (!orgKey || !projectKey) {
    return {
      http_status: 400,
      success: false,
      message: 'Organization key and project key are required',
      content: null
    };
  }
  return apiCall(axiosInstance.patch(`/org/${orgKey}/projects/${projectKey}`, data));
};

const deleteProject = async (orgKey: string, projectKey: string): Promise<RestResult<null>> => {
  if (!orgKey || !projectKey) {
    return {
      http_status: 400,
      success: false,
      message: 'Organization key and project key are required',
      content: null
    };
  }
  return apiCall(axiosInstance.delete(`/org/${orgKey}/projects/${projectKey}`));
};

// Hook for fetching a list of projects
export const useProjects = (orgKey?: string) => {
  return useQuery({
    queryKey: projectKeys.lists(orgKey || ''),
    queryFn: () => safeApiCall(listProjects(orgKey || '')),
    enabled: !!orgKey,
  });
};

// Hook for fetching a single project
export const useProject = (orgKey?: string, projectKey?: string) => {
  return useQuery({
    queryKey: projectKeys.detail(orgKey || '', projectKey || ''),
    queryFn: () => safeApiCall(getProject(orgKey || '', projectKey || '')),
    enabled: !!orgKey && !!projectKey,
  });
};

// Hook for creating a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgKey, projectKey, data }: { orgKey: string; projectKey: string; data: CreateProjectBody }) => {
      return safeApiCall(createProject(orgKey, projectKey, data));
    },
    onSuccess: (_, { orgKey }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(orgKey) });
    },
  });
};

// Hook for updating a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgKey, projectKey, data }: { orgKey: string; projectKey: string; data: UpdateProjectBody }) => {
      return safeApiCall(updateProject(orgKey, projectKey, data));
    },
    onSuccess: (_, { orgKey, projectKey }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(orgKey) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(orgKey, projectKey) });
    },
  });
};

// Hook for deleting a project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgKey, projectKey }: { orgKey: string; projectKey: string }) => {
      return safeApiCall(deleteProject(orgKey, projectKey));
    },
    onSuccess: (_, { orgKey, projectKey }) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(orgKey, projectKey) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists(orgKey) });
    },
  });
}; 