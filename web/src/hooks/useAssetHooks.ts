import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@skystore/core_types';
import { api } from '../api/apiClient';

// Query keys for assets
const assetKeys = {
  all: ['assets'] as const,
  lists: (orgKey: string, projectKey: string, missionKey: string) => [...assetKeys.all, 'list', orgKey, projectKey, missionKey] as const,
  detail: (orgKey: string, projectKey: string, missionKey: string, assetId: string) => [...assetKeys.all, 'detail', orgKey, projectKey, missionKey, assetId] as const,
};
// API calls integrated into hooks
const listAssets = async () => {
  const response = await api.assets.get({query: {owner_uuid: 'default', uploader_uuid: 'default'}});
  return response.data;
};

const getAsset = async (assetId: string) => {
  const response = await api.assets[':id'].get({ params: { id: assetId } });
  return response.data;
};

const createAsset = async (file: File, owner_uuid: string, uploader_uuid: string, mission_uuid?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner_uuid', owner_uuid);
  formData.append('uploader_uuid', uploader_uuid);
  if (mission_uuid) {
    formData.append('mission_uuid', mission_uuid);
  }
  
  const response = await api.assets.upload.post({
    file: file,
    owner_uuid: owner_uuid,
    uploader_uuid: uploader_uuid,
  //  mission_uuid: mission_uuid
  });
  return response.data;
};

const deleteAsset = async (assetId: string) => {
  await api.assets[':id'].delete({ params: { id: assetId } });
};

// Hook for fetching a list of assets
export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => listAssets(),
  });
};

// Hook for fetching a single asset
export const useAsset = (assetId: string) => {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => getAsset(assetId),
  });
};

// Hook for creating an asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, owner_uuid, uploader_uuid, mission_uuid }: { file: File; owner_uuid: string; uploader_uuid: string; mission_uuid?: string }) =>
      createAsset(file, owner_uuid, uploader_uuid, mission_uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    }
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