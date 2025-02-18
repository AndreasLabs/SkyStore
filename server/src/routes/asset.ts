import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';

export const assetRoutes = createBaseRoute('/org/:org_key/project/:project_key/mission/:mission_key/assets')
  .get('/', ({ params }) => {
    // List assets
  })
  .post('/upload', ({ params, body }) => {
    // Upload asset
  })
  .get('/:id', ({ params }) => {
    // Get asset
  })
  .get('/:id/thumbnail', ({ params }) => {
    // Get asset thumbnail
  })
  .delete('/:id', ({ params }) => {
    // Delete asset
  }); 