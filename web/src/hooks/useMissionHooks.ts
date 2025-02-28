import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mission, CreateMissionBody, Task } from '@skystore/core_types';
import { axiosInstance } from '../api/apiClient';

// Query keys for missions
const missionKeys = {
  all: ['missions'] as const,
  lists: (orgKey: string, projectKey: string) => [...missionKeys.all, 'list', orgKey, projectKey] as const,
  detail: (orgKey: string, projectKey: string, missionKey: string) => [...missionKeys.all, 'detail', orgKey, projectKey, missionKey] as const,
};

// Query keys for tasks
const taskKeys = {
    all: ['tasks'] as const,
    lists: (orgKey: string, projectKey: string, missionKey: string) => [...taskKeys.all, 'list', orgKey, projectKey, missionKey] as const,
    detail: (taskId: string) => [...taskKeys.all, 'detail', taskId] as const,
};

// API calls integrated into hooks
const listMissions = async (orgKey: string, projectKey: string) => {
  const response = await axiosInstance.get<Mission[]>(`/org/${orgKey}/project/${projectKey}/missions`);
  return response.data;
};

const getMission = async (orgKey: string, projectKey: string, missionKey: string) => {
  const response = await axiosInstance.get<Mission>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}`);
  return response.data;
};

const createMission = async (orgKey: string, projectKey: string, missionKey: string, data: CreateMissionBody) => {
  const response = await axiosInstance.post<Mission>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}`, data);
  return response.data;
};

const updateMissionMetadata = async (orgKey: string, projectKey: string, missionKey: string, metadata: Record<string, string>) => {
  const response = await axiosInstance.patch<Mission>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/metadata`, metadata);
  return response.data;
};

// Hook for fetching a list of missions
export const useMissions = (orgKey: string, projectKey: string) => {
  return useQuery({
    queryKey: missionKeys.lists(orgKey, projectKey),
    queryFn: () => listMissions(orgKey, projectKey),
    enabled: !!orgKey && !!projectKey, // Only run the query if we have both keys
  });
};

// Hook for fetching a single mission
export const useMission = (orgKey: string, projectKey: string, missionKey: string) => {
  return useQuery({
    queryKey: missionKeys.detail(orgKey, projectKey, missionKey),
    queryFn: () => getMission(orgKey, projectKey, missionKey),
    enabled: !!orgKey && !!projectKey && !!missionKey, // Only run the query if we have all keys
  });
};

// Hook for creating a mission
export const useCreateMission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgKey, projectKey, missionKey, data }: { orgKey: string; projectKey: string; missionKey: string; data: CreateMissionBody }) =>
      createMission(orgKey, projectKey, missionKey, data),
    onSuccess: (_, { orgKey, projectKey }) => {
      // Invalidate the missions list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: missionKeys.lists(orgKey, projectKey) });
    },
  });
};

// Hook for updating mission metadata
export const useUpdateMissionMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgKey, projectKey, missionKey, metadata }: { orgKey: string; projectKey: string; missionKey: string; metadata: Record<string, string> }) =>
      updateMissionMetadata(orgKey, projectKey, missionKey, metadata),
    onSuccess: (_, { orgKey, projectKey, missionKey }) => {
      // Invalidate the specific mission detail
      queryClient.invalidateQueries({ queryKey: missionKeys.detail(orgKey, projectKey, missionKey) });
    },
  });
};

// --- Tasks ---

const listTasks = async (orgKey: string, projectKey: string, missionKey: string) => {
    const response = await axiosInstance.get<Task[]>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks`);
    return response.data;
};

const getTask = async (taskId: string) => {
    const response = await axiosInstance.get<Task>(`/tasks/${taskId}`); // Adjust endpoint as needed
    return response.data;
};

// Hook for fetching a list of tasks for a mission
export const useTasks = (orgKey: string, projectKey: string, missionKey: string) => {
    return useQuery({
        queryKey: taskKeys.lists(orgKey, projectKey, missionKey),
        queryFn: () => listTasks(orgKey, projectKey, missionKey),
        enabled: !!orgKey && !!projectKey && !!missionKey,
    });
};

// Hook for fetching a single task
export const useTask = (taskId: string) => {
    return useQuery({
        queryKey: taskKeys.detail(taskId),
        queryFn: () => getTask(taskId),
        enabled: !!taskId,
    });
};

// Add other task-related hooks (createTask, updateTask, etc.) as needed 