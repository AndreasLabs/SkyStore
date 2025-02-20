import { t } from 'elysia';
import { createBaseRoute } from './base';
import { assetController } from '../controllers/asset';
import { Asset } from '@skystore/core_types';
import { State } from '../types/State';

export const assetRoutes = createBaseRoute('/org/:org_key/project/:project_key/mission/:mission_key/assets')
  // List assets for a mission
  .get('/', 
    async ({ params: { org_key, project_key, mission_key }, store }: {
      params: { org_key: string, project_key: string, mission_key: string },
      store: State
    }) => {
      const assets = await assetController.listMissionAssets(
        org_key,
        project_key,
        mission_key,
        store.redis
      );

      return {
        success: true,
        data: assets
      };
    }, {
      params: t.Object({
        org_key: t.String(),
        project_key: t.String(),
        mission_key: t.String()
      })
    }
  )

  // Upload a new asset
  .post('/upload', 
    async ({ params: { org_key, project_key, mission_key }, body, store }: { 
      params: { org_key: string, project_key: string, mission_key: string }, 
      body: { file: File }, 
      store: State 
    }) => {
      const file = body.file;
      if (!file || !(file instanceof File)) {
        throw new Error('No file provided or invalid file');
      }

      const asset = await assetController.createAsset(
        file,
        org_key,
        project_key,
        mission_key,
        store.redis
      );

      return {
        success: true,
        data: asset
      };
    }, {
      body: t.Object({
        file: t.Any() // File type from multipart form
      }),
      params: t.Object({
        org_key: t.String(),
        project_key: t.String(),
        mission_key: t.String()
      })
    }
  )

  // Get asset by ID
  .get('/:id', 
    async ({ params: { org_key, project_key, mission_key, id }, store }: {
      params: { org_key: string, project_key: string, mission_key: string, id: string },
      store: State
    }) => {
      const asset = await assetController.getAssetById(
        org_key,
        project_key,
        mission_key,
        id,
        store.redis
      );

      return {
        success: true,
        data: asset
      };
    }, {
      params: t.Object({
        org_key: t.String(),
        project_key: t.String(),
        mission_key: t.String(),
        id: t.String()
      })
    }
  )

  // Delete an asset
  .delete('/:id', 
    async ({ params: { org_key, project_key, mission_key, id }, store }: {
      params: { org_key: string, project_key: string, mission_key: string, id: string },
      store: State
    }) => {
      await assetController.deleteAsset(
        org_key,
        project_key,
        mission_key,
        id,
        store.redis
      );

      return {
        success: true
      };
    }, {
      params: t.Object({
        org_key: t.String(),
        project_key: t.String(),
        mission_key: t.String(),
        id: t.String()
      })
    }
  ); 