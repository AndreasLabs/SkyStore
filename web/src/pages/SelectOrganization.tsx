import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, Text, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconBuilding } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, Organization } from '../api/client';
import { notifications } from '@mantine/notifications';

export function SelectOrganization() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listOrganizations();
      setOrganizations(data || []);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load organizations',
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
            <Text size="xl" fw={700}>Select Organization</Text>
            <Text c="dimmed">Select an existing organization or create a new one to get started</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/org/create')}
          >
            Create Organization
          </Button>
        </Group>

        {organizations.length === 0 ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconBuilding size={48} opacity={0.5} />
              <Text ta="center" size="lg" fw={500}>No Organizations Yet</Text>
              <Text ta="center" c="dimmed">
                Create your first organization to start managing your astronomical projects
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate('/org/create')}
              >
                Create Organization
              </Button>
            </Stack>
          </Card>
        ) : (
          <Grid>
            {organizations.map((org) => (
              <Grid.Col key={org.name} span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group wrap="nowrap">
                      <IconBuilding size={24} />
                      <Text fw={500} size="lg" truncate="end">
                        {org.name}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {org.description}
                    </Text>
                    <Button
                      variant="light"
                      fullWidth
                      onClick={() => navigate(`/org/${org.name}`)}
                    >
                      Select Organization
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