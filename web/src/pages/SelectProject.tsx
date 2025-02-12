import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, Text, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconFolder } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, Project } from '../api/client';
import { notifications } from '@mantine/notifications';

export function SelectProject() {
  const navigate = useNavigate();
  const { organization } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      loadProjects();
    }
  }, [organization]);

  const loadProjects = async () => {
    if (!organization) return;
    try {
      setLoading(true);
      const data = await apiClient.listProjects(organization);
      setProjects(data || []);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load projects',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
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
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate(`/org/${organization}/project/create`)}
          >
            Create Project
          </Button>
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
              <Grid.Col key={project.name} span={{ base: 12, sm: 6, md: 4 }}>
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
                      onClick={() => navigate(`/org/${organization}/project/${project.name}`)}
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