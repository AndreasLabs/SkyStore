import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, CreateMissionPayload, Mission } from '../client';
import { queryClient } from '../queryClient';

// Query Keys
export const missionKeys = {
  all: ['miss_missions'] as const,
  lists: () => [...missionKeys.all, 'miss_list'] as const,
  list: (orgId: string, projId: string) => [...missionKeys.lists(), orgId, projId] as const,
  details: () => [...missionKeys.all, 'miss_detail'] as const,
  detail: (orgId: string, projId: string, id: string) => [...missionKeys.details(), orgId, projId, id] as const,
};

export function useMissions(organizationId: string, projectId: string) {
  return useQuery({
    queryKey: missionKeys.list(organizationId, projectId),
    queryFn: () => apiClient.listMissions(organizationId, projectId),
    enabled: Boolean(organizationId && projectId),
  });
}

export function useMission(organizationId: string, projectId: string, missionId: string) {
  return useQuery({
    queryKey: missionKeys.detail(organizationId, projectId, missionId),
    queryFn: () => apiClient.getMission(organizationId, projectId, missionId),
    enabled: Boolean(organizationId && projectId && missionId),
  });
}

export function useCreateMission() {
  return useMutation({
    mutationFn: (payload: CreateMissionPayload) => apiClient.createMission(payload),
    onSuccess: (_, { organization, project }) => {
      queryClient.invalidateQueries({ queryKey: missionKeys.list(organization, project) });
    },
  });
}

export function useUpdateMission() {
  return useMutation({
    mutationFn: ({ organizationId, projectId, missionId, data }: 
      { organizationId: string; projectId: string; missionId: string; data: Partial<Mission> }) =>
      apiClient.updateMission(organizationId, projectId, missionId, data),
    onSuccess: (_, { organizationId, projectId, missionId }) => {
      queryClient.invalidateQueries({ queryKey: missionKeys.detail(organizationId, projectId, missionId) });
      queryClient.invalidateQueries({ queryKey: missionKeys.list(organizationId, projectId) });
    },
  });
} 