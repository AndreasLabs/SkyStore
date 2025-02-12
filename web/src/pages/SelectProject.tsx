import React from 'react';
import { Container, Grid, Card, Text, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconFolder } from '@tabler/icons-react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useProjects, useOrganization } from '../api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export function SelectProject() {
  const navigate = useNavigate();
  const { organization } = useParams();
  const queryClient = useQueryClient();

  // If no organization is selected, redirect immediately
  if (!organization) {
    return <Navigate to="/org" replace />;
  }

  // Fetch organization to validate it exists
  const { data: org, isLoading: orgLoading, error: orgError } = useOrganization(organization);

  // Fetch projects for the organization
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    error: projectsError,
    refetch 
  } = useProjects(organization);

  const isLoading = orgLoading || projectsLoading;
  const error = orgError || projectsError;

  // If organization doesn't exist, redirect to org selection
  if (!orgLoading && !org) {
    return <Navigate to="/org" replace />;
  }

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconFolder size={48} opacity={0.5} color="red" />
            <Text ta="center" size="lg" fw={500} c="red">Error Loading Projects</Text>
            <Text ta="center" c="dimmed">{error instanceof Error ? error.message : 'Failed to load projects'}</Text>
            <Group>
              <Button
                variant="light"
                onClick={() => refetch()}
              >
                Retry
              </Button>
              <Button
                variant="subtle"
                color="red"
                onClick={() => navigate('/org')}
              >
                Change Organization
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
            <Text size="xl" fw={700}>Select Project</Text>
            <Text c="dimmed">Select an existing project or create a new one to get started</Text>
          </Stack>
          <Group>
            <Button
              variant="subtle"
              onClick={() => navigate('/org')}
            >
              Change Organization
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate(`/org/${organization}/project/create`)}
            >
              Create Project
            </Button>
          </Group>
        </Group>

        {projects.length === 0 ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconFolder size={48} opacity={0.5} />
              <Text ta="center" size="lg" fw={500}>No Projects Yet</Text>
              <Text ta="center" c="dimmed">
                Create your first project to start managing your astronomical missions
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate(`/org/${organization}/project/create`)}
              >
                Create Project
              </Button>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {projects.map((project) => (
              <Grid.Col key={project.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group wrap="nowrap">
                      <IconFolder size={24} />
                      <Text fw={500} size="lg" truncate="end">
                        {project.name}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {project.description}
                    </Text>
                    <Button
                      variant="light"
                      fullWidth
                      onClick={() => {
                        // Clear missions query cache before navigation
                        queryClient.removeQueries({ queryKey: ['missions'] });
                        
                        // Force clean navigation
                        window.history.pushState({}, '', `/org/${organization}/project/${project.key}`);
                        navigate(`/org/${organization}/project/${project.key}`);
                      }}
                    >
                      Select Project
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
} 