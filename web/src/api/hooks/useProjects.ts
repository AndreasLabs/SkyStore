import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, Project } from '../client';
import { queryClient } from '../queryClient';

// Query Keys
export const projectKeys = {
  root: ['projects'] as const,
  lists: () => [...projectKeys.root, 'list'] as const,
  list: (orgId: string | undefined) => 
    orgId ? [...projectKeys.lists(), orgId] as const : null,
  details: () => [...projectKeys.root, 'detail'] as const,
  detail: (orgId: string | undefined, id: string | undefined) => 
    orgId && id ? [...projectKeys.details(), orgId, id] as const : null,
};

export function useProjects(organizationId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.list(organizationId) ?? projectKeys.lists(),
    queryFn: () => apiClient.listProjects(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useProject(organizationId: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(organizationId, id) ?? projectKeys.details(),
    queryFn: () => apiClient.getProject(organizationId!, id!),
    enabled: Boolean(organizationId && id),
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: ({ organization, id, data }: { organization: string; id: string; data: Omit<Project, 'id'> }) =>
      apiClient.createProject(organization, id, data),
    onSuccess: (_, { organization }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organization) });
    },
  });
}

export function useUpdateProject() {
  return useMutation({
    mutationFn: ({ organization, id, data }: { organization: string; id: string; data: Partial<Omit<Project, 'id'>> }) =>
      apiClient.updateProject(organization, id, data),
    onSuccess: (_, { organization, id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(organization, id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organization) });
    },
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: ({ organization, id }: { organization: string; id: string }) =>
      apiClient.deleteProject(organization, id),
    onSuccess: (_, { organization, id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list(organization) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(organization, id) });
    },
  });
} 