import React from 'react';
import { Container, Grid, Card, Text, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconRocket } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMissions } from '../api/hooks';

export function ProjectDashboard() {
  const navigate = useNavigate();
  const { organization, project } = useParams();
  const { 
    data: missions = [], 
    isLoading, 
    error,
    refetch 
  } = useMissions(organization || '', project || '');

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
            <IconRocket size={48} opacity={0.5} color="red" />
            <Text ta="center" size="lg" fw={500} c="red">Error Loading Missions</Text>
            <Text ta="center" c="dimmed">{error instanceof Error ? error.message : 'Failed to load missions'}</Text>
            <Button
              variant="light"
              onClick={() => refetch()}
            >
              Retry
            </Button>
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
            <Text size="xl" fw={700}>Project Dashboard</Text>
            <Text c="dimmed">Create and manage observation missions</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate(`/org/${organization}/project/${project}/mission/create`)}
          >
            Create Mission
          </Button>
        </Group>

        {missions.length === 0 ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconRocket size={48} opacity={0.5} />
              <Text ta="center" size="lg" fw={500}>No Missions Yet</Text>
              <Text ta="center" c="dimmed">
                Create your first observation mission to get started
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate(`/org/${organization}/project/${project}/mission/create`)}
              >
                Create Mission
              </Button>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {missions.map((mission) => (
              <Grid.Col key={mission.mission} span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group wrap="nowrap">
                      <IconRocket size={24} />
                      <Text fw={500} size="lg" truncate="end">
                        {mission.name}
                      </Text>
                    </Group>
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        <strong>Location:</strong> {mission.location || 'Not specified'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        <strong>Date:</strong> {mission.date ? new Date(mission.date).toLocaleDateString() : 'Not specified'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        <strong>Target:</strong> {mission.metadata.target || 'Not specified'}
                      </Text>
                    </Stack>
                    <Group grow>
                      <Button
                        variant="light"
                        onClick={() => navigate(`/org/${organization}/project/${project}/mission/${mission.mission}`)}
                      >
                        View Mission
                      </Button>
                      <Button
                        variant="light"
                        onClick={() => navigate(`/org/${organization}/project/${project}/mission/${mission.mission}/assets`)}
                      >
                        Assets
                      </Button>
                    </Group>
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