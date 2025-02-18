import { Elysia, t } from 'elysia';
import { createBaseRoute } from './base';

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
  .get('/', ({ query }) => {
    // List users with pagination
  })
  .post('/', ({ body }) => {
    // Create user
  }, {
    body: userSchema
  })
  .get('/:id', ({ params }) => {
    // Get user by id
  })
  .patch('/:id', ({ params, body }) => {
    // Update user
  }, {
    body: userSchema
  })
  .patch('/:id/settings', ({ params, body }) => {
    // Update user settings
  }, {
    body: userSettingsSchema
  })
  .delete('/:id', ({ params }) => {
    // Delete user
  }); 