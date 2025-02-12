# ODM Bridge

A service that bridges Redis events with WebODM API calls for processing drone imagery.

## Overview

The ODM Bridge listens for Redis events related to mission processing and coordinates with WebODM to process drone imagery. It handles:

- Receiving mission processing requests via Redis
- Converting Minio object paths to presigned URLs
- Creating and monitoring WebODM tasks
- Publishing progress and completion events back to Redis

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
bun install
```

3. Start the service:
```bash
bun run src/index.ts
```

## Redis Events

### Subscribed Events (Listen for these)

- `mission_create` - New mission created
  ```json
  {
    "mission": "string",
    "organization": "string",
    "project": "string",
    "data": {
      "metadata": {
        "altitude": "string",
        "overlap_percent": "string",
        "sidelap_percent": "string",
        "ground_resolution": "string"
      }
    }
  }
  ```

- `mission_asset_uploaded` - New asset uploaded to a mission
  ```json
  {
    "mission": "string",
    "asset": {
      "path": "string"
    }
  }
  ```

- `mission_process` - Request to process a mission
  ```json
  {
    "missionId": "string",
    "projectId": "number",
    "metadata": {
      "altitude": "string",
      "overlap_percent": "string",
      "sidelap_percent": "string",
      "ground_resolution": "string"
    }
  }
  ```

### Published Events (Emitted by this service)

- `mission_processing` - Task has been created and is being processed
  ```json
  {
    "missionId": "string",
    "projectId": "number",
    "taskId": "number",
    "status": "processing"
  }
  ```

- `mission_progress` - Task progress update
  ```json
  {
    "missionId": "string",
    "projectId": "number",
    "taskId": "number",
    "status": "string",
    "progress": "number"
  }
  ```

- `mission_complete` - Task has completed successfully
  ```json
  {
    "missionId": "string",
    "projectId": "number",
    "taskId": "number",
    "output": {} // WebODM task output
  }
  ```

- `mission_error` - An error occurred during processing
  ```json
  {
    "missionId": "string",
    "error": "string"
  }
  ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REDIS_HOST | Redis server host | localhost |
| REDIS_PORT | Redis server port | 6379 |
| WEBODM_HOST | WebODM API host | http://localhost:3000 |
| WEBODM_USERNAME | WebODM username | admin |
| WEBODM_PASSWORD | WebODM password | admin |
| MINIO_ENDPOINT | Minio server endpoint | localhost:9000 |
| MINIO_ACCESS_KEY | Minio access key | minioadmin |
| MINIO_SECRET_KEY | Minio secret key | minioadmin |
| MINIO_BUCKET | Minio bucket name | skystore |

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
