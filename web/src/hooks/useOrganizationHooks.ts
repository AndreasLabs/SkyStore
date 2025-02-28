import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Organization, CreateOrganizationBody, UpdateOrganizationBody, RestResult } from '@skystore/core_types';
import { axiosInstance, apiCall } from '../api/apiClient';

// Query keys for organizations
const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  detail: (key: string) => [...organizationKeys.all, 'detail', key] as const,
};

// API calls integrated into hooks
const listOrganizations = async (): Promise<RestResult<Organization[]>> => {
  return apiCall(axiosInstance.get('/org'));
};

const getOrganization = async (key: string): Promise<RestResult<Organization>> => {
  return apiCall(axiosInstance.get(`/org/${key}`));
};

const createOrganization = async (key: string, data: CreateOrganizationBody): Promise<RestResult<Organization>> => {
  return apiCall(axiosInstance.post(`/org/${key}`, data));
};

const updateOrganization = async (key: string, data: UpdateOrganizationBody): Promise<RestResult<Organization>> => {
  return apiCall(axiosInstance.patch(`/org/${key}`, data));
};

const deleteOrganization = async (key: string): Promise<RestResult<null>> => {
  return apiCall(axiosInstance.delete(`/org/${key}`));
};

// Hook for fetching a single organization
export const useOrganization = (key: string) => {
  return useQuery({
    queryKey: organizationKeys.detail(key),
    queryFn: () => getOrganization(key).then(result => {
      if (!result.success) throw result;
      return result.content;
    }),
    enabled: !!key
  });
};

// Hook for fetching all organizations
export const useOrganizations = () => {
  return useQuery({
    queryKey: organizationKeys.lists(),
    queryFn: () => listOrganizations().then(result => {
      if (!result.success) throw result;
      return result.content;
    })
  });
};

// Hook for creating an organization
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: CreateOrganizationBody }) => {
      const result = await createOrganization(key, data);
      if (!result.success) throw result;
      return result.content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
};

// Hook for updating an organization
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: UpdateOrganizationBody }) => {
      const result = await updateOrganization(key, data);
      if (!result.success) throw result;
      return result.content;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(key) });
    },
  });
};

// Hook for deleting an organization
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const result = await deleteOrganization(key);
      if (!result.success) throw result;
      return result.content;
    },
    onSuccess: (_, key) => {
      queryClient.removeQueries({ queryKey: organizationKeys.detail(key) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}; 