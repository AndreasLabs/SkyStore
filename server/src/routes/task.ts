import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';

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

export const taskRoutes = createBaseRoute('/org/:org_key/project/:project_key/mission/:mission_key/tasks')
  .get('/', ({ params }) => {
    // List tasks
  })
  .post('/', ({ params, body }) => {
    // Create task
  }, {
    body: taskSchema
  })
  .get('/:id', ({ params }) => {
    // Get task
  })
  .get('/:id/status', ({ params }) => {
    // Get task status
  })
  .patch('/:id', ({ params, body }) => {
    // Update task
  }, {
    body: taskSchema
  })
  .post('/:id/pause', ({ params }) => {
    // Pause task
  })
  .post('/:id/resume', ({ params }) => {
    // Resume task
  })
  .delete('/:id', ({ params }) => {
    // Delete task
  }); 