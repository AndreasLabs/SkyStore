import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@skystore/core_types';
import { axiosInstance } from '../api/apiClient';

// Query keys for assets
const assetKeys = {
  all: ['assets'] as const,
  lists: (orgKey: string, projectKey: string, missionKey: string) => [...assetKeys.all, 'list', orgKey, projectKey, missionKey] as const,
  detail: (orgKey: string, projectKey: string, missionKey: string, assetId: string) => [...assetKeys.all, 'detail', orgKey, projectKey, missionKey, assetId] as const,
};

// API calls integrated into hooks
const listAssets = async (orgKey: string, projectKey: string, missionKey: string) => {
  const response = await axiosInstance.get<Asset[]>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/assets`);
  return response.data;
};

const getAsset = async (orgKey: string, projectKey: string, missionKey: string, assetId: string) => {
  const response = await axiosInstance.get<Asset>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/assets/${assetId}`);
  return response.data;
};

const createAsset = async (orgKey: string, projectKey: string, missionKey: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<Asset>(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/assets`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const deleteAsset = async (orgKey: string, projectKey: string, missionKey: string, assetId: string) => {
  await axiosInstance.delete(`/org/${orgKey}/project/${projectKey}/missions/${missionKey}/assets/${assetId}`);
};

// Hook for fetching a list of assets
export const useAssets = (orgKey: string, projectKey: string, missionKey: string) => {
  return useQuery({
    queryKey: ['assets', orgKey, projectKey, missionKey],
    queryFn: () => listAssets(orgKey, projectKey, missionKey),
    enabled: !!orgKey && !!projectKey && !!missionKey, // Only run the query if we have all keys
  });
};

// Hook for fetching a single asset
export const useAsset = (orgKey: string, projectKey: string, missionKey: string, assetId: string) => {
  return useQuery({
    queryKey: ['asset', orgKey, projectKey, missionKey, assetId],
    queryFn: () => getAsset(orgKey, projectKey, missionKey, assetId),
    enabled: !!orgKey && !!projectKey && !!missionKey && !!assetId, // Only run the query if we have all keys
  });
};

// Hook for creating an asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgKey, projectKey, missionKey, file }: { orgKey: string; projectKey: string; missionKey: string; file: File }) =>
      createAsset(orgKey, projectKey, missionKey, file),
    onSuccess: (_, { orgKey, projectKey, missionKey }) => {
      // Invalidate the assets list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['assets', orgKey, projectKey, missionKey] });
    },
  });
};

// Hook for deleting an asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgKey, projectKey, missionKey, assetId }: { orgKey: string; projectKey: string; missionKey: string; assetId: string }) =>
      deleteAsset(orgKey, projectKey, missionKey, assetId),
    onSuccess: (_, { orgKey, projectKey, missionKey, assetId }) => {
      // Remove the asset from the cache and invalidate the list
      queryClient.removeQueries({ queryKey: ['asset', orgKey, projectKey, missionKey, assetId] });
      queryClient.invalidateQueries({ queryKey: ['assets', orgKey, projectKey, missionKey] });
    },
  });
};

// Hook for generating thumbnail URLs
export const useGetThumbnailUrl = () => {
  const getThumbnailUrl = (asset: Asset, organization: string, project: string, mission: string) => {
    if (!organization || !project || !mission) return '';
    // Assuming thumbnail URL is constructed similarly to presigned URL
    return `${axiosInstance.defaults.baseURL}/org/${organization}/project/${project}/missions/${mission}/assets/${asset.uuid}/thumbnail`;
  };
  return getThumbnailUrl;
};