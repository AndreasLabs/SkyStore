import { describe, expect, test, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import Redis from "ioredis-mock";
import { projectRoutes } from "../../src/routes/project";
import { MockedRedisClient, RedisClient } from "../../src/clients/RedisClient";
import { projectController } from "../../src/controllers";
import { CreateProjectBody } from "@skystore/core_types";

describe("Project Routes", () => {
    let app: any;
    let redis: RedisClient = MockedRedisClient();
    beforeAll( () => {
        console.log('Setting up test environment');
      
        app = new Elysia()
            .decorate({
                redis: redis
            })
            .use(projectRoutes);
    });



    describe("POST /org/:org_key/projects/:key", async () => {
    
        test("should create a new project", async () => {
            const orgKey = "test-org";
            const projectKey = "test-project";
            const projectData = {
                name: "Test Project",
                description: "Test Description",
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid"
            };

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(projectData)
                }))
                .then(res => res.json());

            expect(response).toMatchObject({
                ...projectData,
                key: projectKey,
                organization_key: orgKey
            });

            // Verify data was saved in Redis
            const savedInfo = await redis.getObject(`orgs:${orgKey}:projects:${projectKey}:info`);
            expect(savedInfo).toBeTruthy();
            expect(savedInfo).toMatchObject({
                ...projectData,
                key: projectKey,
                organization_key: orgKey
            });
        });

        test("should reject invalid project key", async () => {
            const orgKey = "test-org";
            const projectKey = "INVALID KEY";
            const projectData = {
                name: "Test Project",
                description: "Test Description",
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid"
            };

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(projectData)
                }));

            expect(response.status).toBe(400);
        });

        test("should reject project creation without required fields", async () => {
            const orgKey = "test-org";
            const projectKey = "test-project-2";

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        description: "Missing required fields"
                    })
                }));

            expect(response.status).toBe(400);
        });
    });

    describe("GET /org/:org_key/projects", () => {
        test("should list projects for an organization", async () => {
            // Setup test data
            const orgKey = "test-org";
            const projectData: CreateProjectBody = {
                key: "test-project",
                name: "Test Project",
                description: "Test Description",
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid",
                organization_key: orgKey,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await projectController.createProject(projectData, redis);
            
            // Make request
            let response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects`))
                .then(res => res.json());
            

            let {createdAt, updatedAt, metadata, ...rest} = response[0];
            let {createdAt: _, updatedAt: __, metadata: ___, ...rest2} = projectData;
            expect(rest).toMatchObject(rest2);
        });
    });

    describe("GET /org/:org_key/projects/:key", () => {
        test("should get a specific project", async () => {
            const orgKey = "test-org";
            const projectKey = "test-project";
            const projectData = {
                key: projectKey,
                name: "Test Project",
                organization_key: orgKey,
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid"
            };

            await redis.setObject(`orgs:${orgKey}:projects:${projectKey}:info`, projectData);

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`))
                .then(res => res.json());

            expect(response).toMatchObject(projectData);
        });

        test("should return 404 for non-existent project", async () => {
            const orgKey = "test-org";
            const projectKey = "non-existent";

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`));

            expect(response.status).toBe(404);
        });
    });

    describe("PATCH /org/:org_key/projects/:key", async () => {
        test("should update an existing project", async () => {
            const orgKey = "test-org";
            const projectKey = "test-project";

            const projectData = {
                key: projectKey,
                name: "Test Project",
                organization_key: orgKey,
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid"
            };
            await redis.setObject(`orgs:${orgKey}:projects:${projectKey}:info`, projectData);


            const updateData = {
                name: "Updated Project",
                description: "Updated Description",
                owner_uuid: "test-owner-uuid",
                organization_uuid: "test-org-uuid"
            };

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData)
                }))
                .then(res => res.json());

            expect(response).toMatchObject(updateData);

            // Verify data was updated in Redis
            const savedInfo = await redis.getObject(`orgs:${orgKey}:projects:${projectKey}:info`);
            expect(savedInfo).toBeTruthy();
            expect(savedInfo).toMatchObject(updateData);
        });
    });

    describe("DELETE /org/:org_key/projects/:key", () => {
        test("should delete a project", async () => {
            const orgKey = "test-org";
            const projectKey = "test-project";
            const projectData = {
                key: projectKey,
                name: "Test Project"
            };

            // Setup initial data
            await redis.setJson(`orgs:${orgKey}:projects:${projectKey}`, projectData);

            const response = await app
                .handle(new Request(`http://localhost/org/${orgKey}/projects/${projectKey}`, {
                    method: "DELETE"
                }))
                .then(res => res.json());

            expect(response).toEqual({ success: true });

            // Verify data was deleted from Redis
            const savedData = await redis.get(`orgs:${orgKey}:projects:${projectKey}`);
            expect(savedData).toBeNull();
        });
    });
}); 