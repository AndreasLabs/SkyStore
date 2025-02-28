import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { organizationController } from '../controllers/organization';
import { State } from '../types/State';

const organizationSchema = t.Object({
  name: t.String(),
  description: t.String(),
  metadata: t.Optional(t.Record(t.String(), t.String()))
});

export const organizationRoutes = createBaseRoute('/org')
  .get('/', async ({ store, wrapSuccess }: { store: State, wrapSuccess: any }) => {
    // List organizations
    const organizations = await organizationController.listOrganizations({ redis: store.redis });
    return wrapSuccess(organizations, 'Organizations retrieved successfully');
  })
  .post('/:org_key', async ({ params, body, store, wrapSuccess }: { params: { org_key: string }, body: any, store: State, wrapSuccess: any }) => {
    // Create organization
    const organization = await organizationController.createOrganization(
      params.org_key,
      body,
      { redis: store.redis }
    );
    return wrapSuccess(organization, 'Organization created successfully');
  }, {
    body: organizationSchema,
    params: t.Object({
      org_key: t.String()
    })
  })
  .get('/:org_key', async ({ params, store, wrapSuccess }: { params: { org_key: string }, store: State, wrapSuccess: any }) => {
    // Get organization
    const organization = await organizationController.getOrganization(
      params.org_key,
      { redis: store.redis }
    );
    return wrapSuccess(organization, 'Organization retrieved successfully');
  }, {
    params: t.Object({
      org_key: t.String()
    })
  })
  .patch('/:org_key', async ({ params, body, store, wrapSuccess }: { params: { org_key: string }, body: any, store: State, wrapSuccess: any }) => {
    // Update organization
    const organization = await organizationController.updateOrganization(
      params.org_key,
      body,
      { redis: store.redis }
    );
    return wrapSuccess(organization, 'Organization updated successfully');
  }, {
    body: organizationSchema,
    params: t.Object({
      org_key: t.String()
    })
  })
  .delete('/:org_key', async ({ params, store, wrapSuccess }: { params: { org_key: string }, store: State, wrapSuccess: any }) => {
    // Delete organization
    await organizationController.deleteOrganization(
      params.org_key,
      { redis: store.redis }
    );
    return wrapSuccess(null, 'Organization deleted successfully');
  }, {
    params: t.Object({
      org_key: t.String()
    })
  }); 