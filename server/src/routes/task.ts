import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { taskController } from '../controllers/task';
import { RedisClient } from '../clients/RedisClient';
import { State } from '../types/State';

const taskSchema = t.Object({
  name: t.String(),
  description: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('in_progress'), 
    t.Literal('completed'),
    t.Literal('failed')
  ]),
  missionId: t.String()
});

const paramsSchema = t.Object({
  org_key: t.String(),
  project_key: t.String(),
  mission_key: t.String()
});

export const taskRoutes = createBaseRoute('/org/:org_key/project/:project_key/mission/:mission_key/tasks')
  .get('/', async ({ params, store }: { params: { mission_key: string }, store: State }) => {
    // List tasks for mission
    const tasks = await taskController.getTasksForMission(params.mission_key, { redis: store.redis });
    return tasks;
  }, {
    params: paramsSchema
  })
  .post('/', async ({ params, body, store }: { params: { mission_key: string }, body: any, store: State }) => {
    // Create new task
    const task = await taskController.createTask({
      ...body,
      missionId: params.mission_key
    }, { redis: store.redis });
    return task;
  }, {
    body: taskSchema,
    params: paramsSchema
  })
  .post('/:task_id/cancel', async ({ params, store }: { params: { mission_key: string, task_id: string }, store: State }) => {
    // Cancel task
    const task = await taskController.cancelTask(params.task_id, params.mission_key, { redis: store.redis });
    return task;
  }, {
    params: t.Object({
      ...paramsSchema.properties,
      task_id: t.String()
    })
  })

  