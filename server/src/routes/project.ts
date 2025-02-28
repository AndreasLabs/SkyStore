import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { projectController } from '../controllers/project';
import { RedisClient } from '../clients/RedisClient'; 
import { CreateProjectBody } from '@skystore/core_types';
import { ServerError } from '../types/ServerError';

const projectSchema = t.Object({
  name: t.String({
    error: 'Name is required and must be a string'
  }),
  description: t.Optional(t.String({
    error: 'Description must be a string if provided'
  })),
  metadata: t.Optional(t.Record(t.String(), t.String(), {
    error: 'Metadata must be a record of string key-value pairs'
  })),
  owner_uuid: t.String({
    error: 'Owner UUID is required and must be a string'
  }),
  organization_uuid: t.String({
    error: 'Organization UUID is required and must be a string'
  })
});

export const projectRoutes = createBaseRoute('/org/:org_key/projects')
  .get('/', async ({ params, store: { redis: RedisClient }, wrapSuccess }) => {
    // List projects
    const projects = await projectController.listProjectsByOrganizationKey(params.org_key, { redis: RedisClient });
    return wrapSuccess(projects || [], 'Projects retrieved successfully');
  }, {
    params: t.Object({
      org_key: t.String()
    })
  })
  .post('/:key', async ({ params, body, store: { redis: RedisClient }, wrapSuccess }) => {
    try {
      // Create project
      const newProject: CreateProjectBody = {
        ...body,
        organization_key: params.org_key,
        key: params.key
      }
      const project = await projectController.createProject(newProject, { redis: RedisClient });
      return wrapSuccess(project, 'Project created successfully');
    } catch (error) {
      if (error instanceof ServerError) {
        throw error;
      }
      // Enhance validation error messages
      if (error instanceof Error) {
        throw new ServerError(error.message, 400, {
          missing_required_fields: [],
          invalid_fields: [],
          received_value: body
        });
      }
      throw error;
    }
  }, {
    body: projectSchema,
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .get('/:key', async ({ params, store: { redis: RedisClient }, wrapSuccess }) => {
    // Get project
    const project = await projectController.getProjectByKey(params.org_key, params.key, { redis: RedisClient });
    return wrapSuccess(project, 'Project retrieved successfully');
  }, {
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .patch('/:key', async ({ params, body, store: { redis: RedisClient }, wrapSuccess }) => {
    // Update project
    const project = await projectController.updateProject(params.org_key, params.key, body, { redis: RedisClient });
    return wrapSuccess(project, 'Project updated successfully');
  }, {
    body: projectSchema,
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  })
  .delete('/:key', async ({ params, store: { redis: RedisClient }, wrapSuccess }) => {
    // Delete project
    await projectController.deleteProject(params.org_key, params.key, { redis: RedisClient });
    return wrapSuccess(null, 'Project deleted successfully');
  }, {
    params: t.Object({
      org_key: t.String(),
      key: t.String()
    })
  });