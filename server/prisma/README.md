# Prisma Setup for SkyStore

This directory contains the Prisma schema and database setup for the SkyStore application.

## Models

- **User**: Handles user authentication and profile information
- **Asset**: Represents files stored in the system
- **Mission**: Groups assets by mission information

## Getting Started

1. Make sure your database is running (PostgreSQL)
2. Generate the Prisma client:
   ```
   bun run prisma:generate
   ```
3. Push the schema to the database:
   ```
   bun run prisma:db:push
   ```
   or create a migration:
   ```
   bun run prisma:migrate:dev --name init
   ```
4. Explore your database with Prisma Studio:
   ```
   bun run prisma:studio
   ```

## Environment Variables

Make sure your `.env` file contains the database connection string:
```
DATABASE_URL="postgresql://username:password@localhost:5432/skystore?schema=public"
```

## Usage

Import the Prisma client in your code:

```typescript
import { prisma } from '../lib/prisma';

// Example: Create a new user
const newUser = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashedpassword', // Make sure to hash passwords!
    firstName: 'John',
    lastName: 'Doe'
  }
});
``` 