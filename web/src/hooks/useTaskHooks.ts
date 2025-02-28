import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@skystore/core_types';
import { axiosInstance } from '../api/apiClient';

// API Calls
const getTask = async (taskId: string) => {
    const response = await axiosInstance.get<Task>(`/tasks/${taskId}`); // Adjust endpoint as needed
    return response.data;
};

const listTasks = async (orgKey: string, projectKey: string, missionKey: string) => {
    const response = await axiosInstance.get<Task[]>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks`);
    return response.data;
};

const createTask = async (orgKey: string, projectKey: string, missionKey: string, taskData: any) => { // Replace 'any' with a proper type
    const response = await axiosInstance.post<Task>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks`, taskData);
    return response.data;
};

const updateTask = async (taskId: string, taskData: any) => { // Replace 'any' with a proper type
    const response = await axiosInstance.patch<Task>(`/tasks/${taskId}`, taskData); // Adjust endpoint as needed
    return response.data;
};

const deleteTask = async (taskId: string) => {
    const response = await axiosInstance.delete(`/tasks/${taskId}`); // Adjust endpoint as needed
    return response.data;
};

// Assuming pause/resume are PATCH requests to /tasks/{taskId}/pause and /tasks/{taskId}/resume
const pauseTask = async (orgKey: string, projectKey: string, missionKey: string, taskId: string) => {
    const response = await axiosInstance.patch(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks/${taskId}/pause`);
    return response.data;
};

const resumeTask = async (orgKey: string, projectKey: string, missionKey: string, taskId: string) => {
    const response = await axiosInstance.patch(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks/${taskId}/resume`);
    return response.data;
};

const cancelTask = async (orgKey: string, projectKey: string, missionKey: string, taskId: string) => {
    const response = await axiosInstance.patch(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/tasks/${taskId}/cancel`);
    return response.data;
};

// Hook for fetching a single task
export const useTask = (taskId: string) => {
    return useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTask(taskId),
        enabled: !!taskId
    });
};

// Hook for fetching all tasks for a mission
export const useTasks = (orgKey: string, projectKey: string, missionKey: string) => {
    return useQuery({
        queryKey: ['tasks', orgKey, projectKey, missionKey],
        queryFn: () => listTasks(orgKey, projectKey, missionKey),
        enabled: !!orgKey && !!projectKey && !!missionKey
    });
};

// Hook for creating a task
export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgKey, projectKey, missionKey, taskData }: { orgKey: string, projectKey: string, missionKey: string, taskData: any }) => // Replace 'any'
            createTask(orgKey, projectKey, missionKey, taskData),
        onSuccess: (_, { orgKey, projectKey, missionKey }) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', orgKey, projectKey, missionKey] });
        }
    });
};

// Hook for updating a task
export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, taskData }: { taskId: string, taskData: any }) => // Replace 'any'
            updateTask(taskId, taskData),
        onSuccess: (_, { taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        }
    });
};

// Hook for deleting a task
export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => deleteTask(taskId),
        onSuccess: (_, taskId) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate all tasks
            // Or, if you have a way to invalidate tasks for a specific mission:
            // queryClient.invalidateQueries(['tasks', orgKey, projectKey, missionKey]);
        }
    });
};

// Hook for pausing a task
export const usePauseTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgKey, projectKey, missionKey, taskId }: { orgKey: string, projectKey: string, missionKey: string, taskId: string }) =>
            pauseTask(orgKey, projectKey, missionKey, taskId),
        onSuccess: (_, { orgKey, projectKey, missionKey, taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['task-status', taskId] });
        },
    });
};

// Hook for resuming a task
export const useResumeTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgKey, projectKey, missionKey, taskId }: { orgKey: string, projectKey: string, missionKey: string, taskId: string }) =>
            resumeTask(orgKey, projectKey, missionKey, taskId),
        onSuccess: (_, { orgKey, projectKey, missionKey, taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['task-status', taskId] });
        },
    });
};

// Hook for canceling a task
export const useCancelTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgKey, projectKey, missionKey, taskId }: { orgKey: string, projectKey: string, missionKey: string, taskId: string }) =>
            cancelTask(orgKey, projectKey, missionKey, taskId),
        onSuccess: (_, { orgKey, projectKey, missionKey, taskId }) => {
            queryClient.invalidateQueries({ queryKey: ['task-status', taskId] });
        },
    });
}; 