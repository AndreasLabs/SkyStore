import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';
import { userController } from '../controllers/user';
import { State } from '../types/State';

// Validation schemas
const userSchema = t.Object({
  name: t.String(),
  email: t.String(),
  avatar: t.Optional(t.String()),
  bio: t.Optional(t.String()),
  location: t.Optional(t.String()),
  company: t.Optional(t.String()),
  website: t.Optional(t.String())
});

const userSettingsSchema = t.Object({
  darkMode: t.Boolean(),
  accentColor: t.String(),
  notifications: t.Boolean(),
  emailNotifications: t.Boolean(),
  autoSave: t.Boolean(),
  language: t.String(),
  timezone: t.String(),
  mapStyle: t.String()
});

export const userRoutes = createBaseRoute('/users')
  .get('/', async ({ store }: { store: State }) => {
    // List users
    const users = await userController.listUsers({ redis: store.redis });
    return users;
  })
  .post('/', async ({ body, store }: { body: any, store: State }) => {
    // Create user
    const user = await userController.createUser(body, { redis: store.redis });
    return user;
  })
  .get('/:id', ({ params }) => {
    // Get user by id
  })
  .put('/:key', async ({ params, body, store }: { params: { key: string }, body: any, store: State }) => {
    // Update user
    const user = await userController.updateUser(params.key, body, { redis: store.redis });
    return user;
  })
  .patch('/:id/settings', ({ params, body }) => {
    // Update user settings
  }, {
    body: userSettingsSchema
  })
  .delete('/:key', async ({ params, store }: { params: { key: string }, store: State }) => {
    // Delete user
    await userController.deleteUser(params.key, { redis: store.redis });
    return { success: true };
  }); 