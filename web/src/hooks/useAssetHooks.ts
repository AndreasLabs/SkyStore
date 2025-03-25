import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@skystore/core_types';
import { api } from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

// Query keys for assets
const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  detail: (assetId: string) => [...assetKeys.all, 'detail', assetId] as const,
};

// API calls integrated into hooks
const listAssets = async (owner_uuid: string, uploader_uuid: string) => {
  const response = await api.assets.get({query: {owner_uuid, uploader_uuid}});
  return response.data;
};

const getAsset = async (assetId: string) => {
  const response = await api.assets[':id'].get({ params: { id: assetId } });
  return response.data;
};

const createAsset = async (file: File, owner_uuid: string, uploader_uuid: string, flight_uuid?: string) => {
    logger.info('createAsset', { file, owner_uuid, uploader_uuid, flight_uuid });

    const response = await api.assets.upload.post({
      file: file,
      owner_uuid: owner_uuid,
      uploader_uuid: uploader_uuid,
      flight_uuid: flight_uuid,
    });

  return response.data;
};

const deleteAsset = async (assetId: string) => {
  await api.assets[':id'].delete({ params: { id: assetId } });
};

// Hook for fetching a list of assets
export const useAssets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: assetKeys.lists(),
    queryFn: () => {
      // Only fetch if user exists
      if (!user) {
        return { data: [] }; // Return empty array if no user
      }
      // Use the user.id as both owner and uploader
      return listAssets(user.id, user.id);
    },
    enabled: !!user, // Only run the query if user exists
  });
};

// Hook for fetching a single asset
export const useAsset = (assetId: string) => {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => getAsset(assetId),
  });
};

// Hook for creating an asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ file, flight_uuid }: { file: File; flight_uuid?: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      return createAsset(file, user.id, user.id, flight_uuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    }
  });
};

// Hook for deleting an asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => deleteAsset(assetId),
    onSuccess: (_, assetId) => {
      // Remove the asset from the cache and invalidate the list
      queryClient.removeQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

// Hook for generating thumbnail URLs
export const useGetThumbnailUrl = () => {
  const getThumbnailUrl = (asset: Asset) => {
    if (!asset.thumbnail_url) return '';
    return asset.thumbnail_url;
  };
  return getThumbnailUrl;
};