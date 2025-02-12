import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, Asset } from '../client';
import { queryClient } from '../queryClient';

// Query Keys
export const assetKeys = {
  all: ['asset_assets'] as const,
  lists: () => [...assetKeys.all, 'asset_list'] as const,
  list: (orgId: string, projId: string, missId: string) => 
    [...assetKeys.lists(), orgId, projId, missId] as const,
  details: () => [...assetKeys.all, 'asset_detail'] as const,
  detail: (orgId: string, projId: string, missId: string, id: string) => 
    [...assetKeys.details(), orgId, projId, missId, id] as const,
};

export function useAssets(organizationId: string, projectId: string, missionId: string) {
  return useQuery({
    queryKey: assetKeys.list(organizationId, projectId, missionId),
    queryFn: () => apiClient.getMissionAssets(organizationId, projectId, missionId),
    enabled: Boolean(organizationId && projectId && missionId),
  });
}

export function useAsset(organizationId: string, projectId: string, missionId: string, assetId: string) {
  return useQuery({
    queryKey: assetKeys.detail(organizationId, projectId, missionId, assetId),
    queryFn: () => apiClient.getAsset(organizationId, projectId, missionId, assetId),
    enabled: Boolean(organizationId && projectId && missionId && assetId),
  });
}

export function useUploadAsset() {
  return useMutation({
    mutationFn: ({ organization, project, mission, file }: 
      { organization: string; project: string; mission: string; file: File }) =>
      apiClient.uploadAsset(organization, project, mission, file),
    onSuccess: (_, { organization, project, mission }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.list(organization, project, mission) });
    },
  });
}

export function useGetThumbnailUrl() {
  return (asset: Asset, organization: string, project: string, mission: string) => {
    if (!organization || !project || !mission) return '';
    return apiClient.getThumbnailUrl(organization, project, mission, asset.id);
  };
} 