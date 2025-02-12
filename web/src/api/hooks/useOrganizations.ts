import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, Organization } from '../client';
import { queryClient } from '../queryClient';
import { queryKeys } from './queryKeys';

// Query Keys
export const organizationKeys = {
  root: ['organizations'] as const,
  lists: () => [...organizationKeys.root, 'list'] as const,
  details: () => [...organizationKeys.root, 'detail'] as const,
  detail: (id: string | undefined) => 
    id ? [...organizationKeys.details(), id] as const : null,
};

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.all(),
    queryFn: () => apiClient.listOrganizations(),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.organizations.byId(id) : queryKeys.organizations.root,
    queryFn: () => {
      if (!id) throw new Error('Organization ID is required');
      return apiClient.getOrganization(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Organization, 'id'> }) =>
      apiClient.createOrganization(id, data),
    onSuccess: () => {
      // Invalidate all organization queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.root,
      });
    },
  });
}

export function useUpdateOrganization() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Organization, 'id'>> }) =>
      apiClient.updateOrganization(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific organization and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.byId(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      });
    },
  });
}

export function useDeleteOrganization() {
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteOrganization(id),
    onSuccess: (_, id) => {
      // Remove the specific organization from cache and invalidate list
      queryClient.removeQueries({
        queryKey: queryKeys.organizations.byId(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      });
      
      // Also remove related data
      queryClient.removeQueries({
        queryKey: queryKeys.projects.root,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.missions.root,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.assets.root,
      });
    },
  });
} 