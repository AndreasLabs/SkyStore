import React from 'react';
import { Container, Grid, Card, Text, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconPlus, IconBuilding } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganizations } from '../api/hooks';
import { useQueryClient } from '@tanstack/react-query';

export function SelectOrganization() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const { 
    data: organizations = [], 
    isLoading,
    error,
    refetch,
    isFetching,
  } = useOrganizations();

  // Clear cache when mounting this component
  React.useEffect(() => {
    if (location.pathname === '/org') {
      queryClient.clear();
    }
  }, [location.pathname, queryClient]);

  const handleSelectOrganization = React.useCallback((orgId: string) => {
    if (location.pathname === `/org/${orgId}`) return;
    queryClient.clear();
    navigate(`/org/${orgId}`, { replace: true });
  }, [navigate, queryClient, location.pathname]);

  if (!location.pathname.startsWith('/org') || location.pathname.length > 4) {
    return null;
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
            <IconBuilding size={48} opacity={0.5} color="red" />
            <Text ta="center" size="lg" fw={500} c="red">Error Loading Organizations</Text>
            <Text ta="center" c="dimmed">{error instanceof Error ? error.message : 'Failed to load organizations'}</Text>
            <Button
              variant="light"
              onClick={() => refetch()}
              loading={isFetching}
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
              <Grid.Col key={org.id} span={{ base: 12, sm: 6, md: 4 }}>
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
                      onClick={() => handleSelectOrganization(org.key)}
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