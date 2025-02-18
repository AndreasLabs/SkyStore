import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { projectController } from '../controllers/project';
import { RedisClient } from '../clients/RedisClient'; 
import { CreateProjectBody } from '@skystore/core_types';
import { ServerError } from '../types/ServerError';
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
  .get('/', async ({ params, store: { redis: RedisClient } }) => {
    // List projects
    const projects = await projectController.listProjectsByOrganizationKey(params.org_key, { redis: RedisClient });
    return projects;
  }, {
    params: t.Object({
      org_key: t.String()
    })
  })
  .post('/:key', async ({ params, body, store: { redis: RedisClient } }) => {
    // Create project
    const newProject: CreateProjectBody = {
      ...body,
      organization_key: params.org_key,
      key: params.key
    }
    const project = await projectController.createProject(newProject, { redis: RedisClient });
    return project;
  }, {
    body: projectSchema,
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .get('/:key', async ({ params, store: { redis: RedisClient } }) => {
    // Get project
    const project = await projectController.getProjectByKey(params.org_key, params.key, { redis: RedisClient   });
    return project;
  }, {
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .patch('/:key', async ({ params, body, store: { redis: RedisClient } }) => {
    // Update project
    const project = await projectController.updateProject(params.org_key, params.key, body, { redis: RedisClient });
    return project;
  }, {
    body: projectSchema,
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .delete('/:key', async ({ params, store: { redis: RedisClient } }) => {
    // Delete project
    await projectController.deleteProject(params.org_key, params.key, { redis: RedisClient });
    return { success: true };
  }, {
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  });