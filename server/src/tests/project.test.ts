import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { RedisClient } from "../clients/RedisClient";
import RedisMock from "ioredis-mock";
import { projectRoutes } from "../routes/project";
import { State } from "../types/State";
import { StorageClient } from "../clients/MinioClient";

describe("Project Routes", () => {
  let app: Elysia<{ store: State }>;
  let redisMock: RedisClient;
  let storageMock: StorageClient;

  beforeAll(() => {
    const mockRedis = new RedisMock();
    redisMock = {
      setObject: mockRedis.set.bind(mockRedis),
      getObject: mockRedis.get.bind(mockRedis),
      del: mockRedis.del.bind(mockRedis),
      close: mockRedis.quit.bind(mockRedis)
    } as unknown as RedisClient;

    // Mock storage client with minimal implementation
    storageMock = {
      // Add minimal mock methods as needed
    } as unknown as StorageClient;

    app = new Elysia<{ store: State }>()
      .decorate('store', { redis: redisMock, storage: storageMock })
      .use(projectRoutes);
  });

  afterAll(async () => {
    await redisMock.close();
  });

  it("should create a new project", async () => {
    const response = await app
      .handle(new Request("http://localhost/org/test-org/projects/test-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Project",
          description: "A test project",
          owner_uuid: "test-owner-uuid",
          organization_uuid: "test-org-uuid",
          metadata: {
            key: "test",
            value: "value"
          }
        }),
      }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Project");
    expect(data.key).toBe("test-project");
    expect(data.organization_key).toBe("test-org");
    expect(data.uuid).toBeDefined();
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it("should get a project by key", async () => {
    const response = await app
      .handle(new Request("http://localhost/org/test-org/projects/test-project", {
        method: "GET",
      }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.name).toBe("Test Project");
    expect(data.key).toBe("test-project");
  });

  it("should reject invalid project key", async () => {
    const response = await app
      .handle(new Request("http://localhost/org/test-org/projects/INVALID KEY", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Invalid Project",
          description: "A project with invalid key",
          owner_uuid: "test-owner-uuid",
          organization_uuid: "test-org-uuid",
        }),
      }));

    expect(response.status).toBe(400);
  });

  it("should reject project creation without required fields", async () => {
    const response = await app
      .handle(new Request("http://localhost/org/test-org/projects/test-project-2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "Missing required fields",
        }),
      }));

    expect(response.status).toBe(400);
  });
}); 