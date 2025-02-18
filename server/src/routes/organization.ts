import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';

const organizationSchema = t.Object({
  name: t.String(),
  description: t.String(),
  metadata: t.Record(t.String(), t.String())
});

export const organizationRoutes = createBaseRoute('/organizations')
  .get('/', () => {
    // List organizations
  })
  .post('/:key', ({ params, body }) => {
    // Create organization
    
  }, { body: organizationSchema})
  .get('/:key', ({ params }) => {
    // Get organization
  })
  .patch('/:key', ({ params, body }) => {
    // Update organization
  }, {
    body: organizationSchema
  })
  .delete('/:key', ({ params }) => {
    // Delete organization
  }); 