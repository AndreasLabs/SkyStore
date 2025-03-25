import { t } from 'elysia';
import { createBaseRoute } from './base';
import { assetController } from '../controllers/asset';
import { ServerError } from '../types/ServerError';
import logger from '../logger';

// Update the route to a simpler path structure
export const assetRoutes = createBaseRoute('/assets')
  // List all assets for a user
  .get('/', 
    async ({ query, store }: {
      query: { owner_uuid?: string, uploader_uuid?: string, flight_uuid?: string },
      store: { redis: any }
    }) => {
      try {
        logger.info('Listing assets', { query });
        // For now, we'll list by mission, but in the future this could be updated to filter by owner/uploader
        const assets = await assetController.listUserAssets(query.owner_uuid || '', { flightUuid: query.flight_uuid });

        return {
          success: true,
          data: assets
        };
      } catch (error) {
        if (error instanceof ServerError) {
          return { 
            success: false, 
            error: error.message,
            status: error.status
          };
        }
        return { 
          success: false, 
          error: 'Failed to list assets',
          status: 500 
        };
      }
    }, {
      query: t.Object({
        owner_uuid: t.Optional(t.String()),
        uploader_uuid: t.Optional(t.String())
      })
    }
  )

  // Upload a new asset
  .post('/upload', 
    async ({ body, set }: { 
      body: { 
        file: File, 
        owner_uuid: string, 
        uploader_uuid: string,
        flight_uuid?: string
      },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        const { file, owner_uuid, uploader_uuid, flight_uuid } = body;
        
        if (!file || !(file instanceof File)) {
          set.status = 400;
          return {
            success: false,
            error: 'No file provided or invalid file'
          };
        }

        const asset = await assetController.createAsset(
          file,
          owner_uuid,
          uploader_uuid,
          flight_uuid
        );

        return {
          success: true,
          data: asset
        };
      } catch (err) {
        if (err instanceof ServerError) {
          set.status = err.status;
          return {
            success: false,
            error: err.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to upload asset'
        };
      }
    }, {
      body: t.Object({
        file: t.Any(), // File type from multipart form
        owner_uuid: t.String(),
        uploader_uuid: t.String(),
        flight_uuid: t.Optional(t.String())
      })
    }
  )

  // Get asset by ID
  .get('/:id', 
    async ({ params: { id }, set }: {
      params: { id: string },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        const asset = await assetController.getAssetById(id);

        return {
          success: true,
          data: asset
        };
      } catch (err) {
        if (err instanceof ServerError) {
          set.status = err.status;
          return {
            success: false,
            error: err.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to get asset'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      })
    }
  )

  // Delete an asset
  .delete('/:id', 
    async ({ params: { id }, set }: {
      params: { id: string },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        await assetController.deleteAsset(id);

        return {
          success: true
        };
      } catch (err) {
        if (err instanceof ServerError) {
          set.status = err.status;
          return {
            success: false,
            error: err.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to delete asset'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      })
    }
  )
  
  // Add user access to an asset
  .post('/:id/access', 
    async ({ params: { id }, body, set }: {
      params: { id: string },
      body: { user_uuid: string },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        await assetController.addUserAccess(id, body.user_uuid);
        
        return {
          success: true
        };
      } catch (err) {
        if (err instanceof ServerError) {
          set.status = err.status;
          return {
            success: false,
            error: err.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to add user access'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        user_uuid: t.String()
      })
    }
  )
  
  // Remove user access from an asset
  .delete('/:id/access/:user_uuid', 
    async ({ params: { id, user_uuid }, set }: {
      params: { id: string, user_uuid: string },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        await assetController.removeUserAccess(id, user_uuid);
        
        return {
          success: true
        };
      } catch (err) {
        if (err instanceof ServerError) {
          set.status = err.status;
          return {
            success: false,
            error: err.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to remove user access'
        };
      }
    }, {
      params: t.Object({
        id: t.String(),
        user_uuid: t.String()
      })
    }
  ); 