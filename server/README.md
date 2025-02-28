# SkyStore Server

The backend server for SkyStore, built with Elysia.js, Bun, and PostgreSQL.

## Authentication System

SkyStore uses a JWT-based authentication system to secure API endpoints. The authentication flow includes:

### User Registration
- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "first_name": "string (optional)",
    "last_name": "string (optional)"
  }
  ```
- **Response**: User object (without password)

### User Login
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "identifier": "string (email or username)",
    "password": "string"
  }
  ```
- **Response**: User object with JWT token

### Get Current User
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current user profile

### Logout
- **Endpoint**: `POST /auth/logout`
- **Response**: Success message

### Password Reset
- **Request Reset**:
  - **Endpoint**: `POST /auth/reset-password/request`
  - **Body**: `{ "email": "string" }`
  - **Response**: Success message

- **Confirm Reset**:
  - **Endpoint**: `POST /auth/reset-password/confirm`
  - **Body**: `{ "token": "string", "newPassword": "string" }`
  - **Response**: Success message

## Authentication Middleware

The server includes authentication middleware to protect routes:

- `authMiddleware`: Basic authentication helpers
- `authGuard`: For protecting routes requiring authentication
- `roleGuard`: For role-based access control

## Development

### Setup
1. Install dependencies: `bun install`
2. Set up environment variables in `.env`
3. Generate Prisma client: `bunx prisma generate`
4. Run migrations: `bunx prisma migrate dev`

### Running the Server
```
bun run dev
```

### Testing Authentication Endpoints

#### Register a New User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123", "first_name": "Test", "last_name": "User"}'
```

#### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "testuser", "password": "password123"}'
```

#### Get User Profile (with JWT Token)
```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Request Password Reset
```bash
curl -X POST http://localhost:4000/auth/reset-password/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Reset Password (with Reset Token)
```bash
curl -X POST http://localhost:4000/auth/reset-password/confirm \
  -H "Content-Type: application/json" \
  -d '{"token": "RESET_TOKEN", "newPassword": "newpassword123"}'
```

#### Logout
```bash
curl -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```