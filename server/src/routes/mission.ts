import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { missionController } from '../controllers/mission';
import { State } from '../types/State';

const missionSchema = t.Object({
  name: t.String(),
  location: t.String(),
  date: t.String(), // ISO string
  metadata: t.Optional(t.Record(t.String(), t.String()))
});

const paramsSchema = t.Object({
  org_key: t.String(),
  project_key: t.String()
});

const missionParamsSchema = t.Object({
  ...paramsSchema.properties,
  mission_key: t.String()
});

export const missionRoutes = createBaseRoute('/org/:org_key/project/:project_key/missions')
  .get('/', async ({ params, store }: { params: { org_key: string, project_key: string }, store: State }) => {
    // List missions for project
    const missions = await missionController.listMissions(params.org_key, params.project_key, { redis: store.redis });
    return missions;
  }, {
    params: paramsSchema
  })
  .post('/:mission_key', async ({ params, body, store }: { params: { org_key: string, project_key: string, mission_key: string }, body: any, store: State }) => {
    // Create new mission
    const mission = await missionController.createMission(
      {
        organization: params.org_key,
        project: params.project_key,
        mission: params.mission_key
      },
      body,
      { redis: store.redis }
    );
    return mission;
  }, {
    body: missionSchema,
    params: missionParamsSchema
  })
  .get('/:mission_key', async ({ params, store }: { params: { org_key: string, project_key: string, mission_key: string }, store: State }) => {
    // Get mission details
    const mission = await missionController.getMission(
      {
        organization: params.org_key,
        project: params.project_key,
        mission: params.mission_key
      },
      { redis: store.redis }
    );
    return mission;
  }, {
    params: missionParamsSchema
  })
  .patch('/:mission_key/metadata', async ({ params, body, store }: { params: { org_key: string, project_key: string, mission_key: string }, body: Record<string, string>, store: State }) => {
    // Update mission metadata
    const mission = await missionController.updateMissionMetadata(
      {
        organization: params.org_key,
        project: params.project_key,
        mission: params.mission_key
      },
      body,
      { redis: store.redis }
    );
    return mission;
  }, {
    body: t.Record(t.String(), t.String()),
    params: missionParamsSchema
  }); 