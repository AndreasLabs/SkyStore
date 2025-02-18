import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { projectController } from '../controllers/project';
import { RedisClient } from '../clients/RedisClient'; 
import { CreateProjectBody } from '@skystore/core_types';

const projectSchema = t.Object({
  name: t.String(),
  description: t.Optional(t.String()),
  metadata: t.Optional(t.Object({
    key: t.String(),
    value: t.String()
  })),
  owner_uuid: t.String(),
  organization_uuid: t.String(),
});


export const projectRoutes = createBaseRoute('/org/:org_key/projects')
  .get('/', ({ params, store: { redis } }) => {
    // List projects
  })
  .post('/:key', async ({ params, body, store: { redis } }) => {
    // Create project
    const newProject: CreateProjectBody = {
      ...body,
      organization_key: params.org_key,
      key: params.key
    }
    const project = await projectController.createProject(newProject, { redis });
    return project;
  }, {
    body: projectSchema,
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .get('/:key', async ({ params, store: { redis } }) => {
    // Get project
    const project = await projectController.getProjectByKey(params.org_key, params.key, { redis });
    return project;
  }, {
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .patch('/:key', ({ params, body, store: { redis } }) => {
    // Update project
  }, {
    body: projectSchema
  })
  .delete('/:key', ({ params, store: { redis } }) => {
    // Delete project
  }); 