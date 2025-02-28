import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, CreateUserBody, UpdateUserBody, UpdateUserSettingsBody } from '@skystore/core_types';
import { axiosInstance } from '../api/apiClient';
import { notifications } from '@mantine/notifications';

// Query keys for users
const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
};

// API calls integrated into hooks
const listUsers = async () => {
  const response = await axiosInstance.get<User[]>('/users');
  return response.data;
};

const getUser = async (userId: string) => {
  const response = await axiosInstance.get<User>(`/users/${userId}`);
  return response.data;
};

const createUser = async (data: CreateUserBody) => {
  const response = await axiosInstance.post<User>('/users', data);
  return response.data;
};

const updateUser = async (userId: string, userData: UpdateUserBody) => {
  const response = await axiosInstance.patch<User>(`/users/${userId}`, userData);
  return response.data;
};

const updateUserSettings = async (userId: string, settings: UpdateUserSettingsBody) => {
  const response = await axiosInstance.patch<User>(`/users/${userId}/settings`, settings);
  return response.data;
};

const deleteUser = async (userId: string) => {
  await axiosInstance.delete(`/users/${userId}`);
};

// Hook for fetching a list of users
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: listUsers,
  });
};

// Hook for fetching a single user
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: !!userId, // Only run the query if we have a userId
  });
};

// Hook for creating a user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserBody) => createUser(data),
    onSuccess: () => {
      // Invalidate the users list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Hook for updating user data
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateUserBody }) => updateUser(id, data),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['user', id], data);
      notifications.show({
        title: 'Success',
        message: 'User profile updated successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update user profile',
        color: 'red',
      });
    },
  });
};

// Hook for updating user settings
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateUserSettingsBody }) => updateUserSettings(id, data),
    onSuccess: (data, {id}) => {
      queryClient.setQueryData(['user', id], data); // Update the user data
      notifications.show({
        title: 'Success',
        message: 'Settings updated successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update settings',
        color: 'red',
      });
    },
  });
};

// Hook for deleting a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      // Remove the user from the cache and invalidate the list
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}; 