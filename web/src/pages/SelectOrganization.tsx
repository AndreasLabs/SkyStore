// @ts-nocheck
import React from 'react';
import {
  Container,
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Title,
  ThemeIcon,
  SimpleGrid,
  Box,
} from '@mantine/core';
import { IconBuildingSkyscraper, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../hooks/useOrganizationHooks';
import { Organization } from '@skystore/core_types';
import { useCurrentUser } from '../contexts/UserContext';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import { loggers } from '../utils/logger';

const log = loggers.organization;

export function SelectOrganization() {
  const navigate = useNavigate();
  const { data: organizations = [], isLoading } = useOrganizations();
  const { user } = useCurrentUser();
  const { setOrganization } = useCurrentOrganization();

  const handleOrganizationSelect = (orgKey: string | null) => {
    log.info('Organization selection clicked', {
      orgKey,
      currentPath: window.location.pathname,
      isUnselect: !orgKey
    });

    setOrganization(orgKey);
    
    // Only navigate to project selection if we're selecting an organization
    if (orgKey) {
      log.info('Navigating after org selection', {
        orgKey,
        destination: `/org/${orgKey}`
      });
      // Navigate directly without setTimeout since setOrganization handles the state update
      navigate(`/org/${orgKey}`);
    }
    // Navigation for unselect is handled in the hook
  };

  log.info('Rendering SelectOrganization', {
    organizationCount: organizations.length,
    isLoading,
    currentUser: user?.name
  });

  console.log('Organizations:', organizations);

  return (
    <Box h="100%" pt={100}>
      <Container size="lg" h="100%">
        <Stack gap={50} justify="flex-start">
          <Stack gap="xs" align="center">
            <Title order={2} fw={500} className="text-gradient" ta="center">
              Welcome back, {user?.name}
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              Select an organization to get started
            </Text>
          </Stack>

          <Stack gap="xl">
            <Group justify="flex-end">
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => navigate('/org/create')}
              >
                Create Organization
              </Button>
            </Group>

            {organizations.length === 0 && !isLoading ? (
              <Card withBorder className="neo-glass">
                <Stack align="center" gap="md" py="xl">
                  <ThemeIcon
                    size={60}
                    radius="md"
                    className="glass-icon"
                  >
                    <IconBuildingSkyscraper size={30} />
                  </ThemeIcon>
                  <Text ta="center" fw={500}>No Organizations Yet</Text>
                  <Text ta="center" size="sm" c="dimmed">
                    Create your first organization to start managing projects
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => navigate('/org/create')}
                  >
                    Create Organization
                  </Button>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {organizations.map((org) => {
                  const orgKey = org.key || org.id;
                  return (
                    <Card 
                      key={orgKey} 
                      withBorder
                      className="neo-glass"
                      onClick={() => handleOrganizationSelect(orgKey)}
                      style={{ cursor: 'pointer' }}
                      padding="lg"
                    >
                      <Stack gap="md">
                        <Group>
                          <ThemeIcon
                            size={40}
                            radius="md"
                            className="glass-icon"
                          >
                            <IconBuildingSkyscraper size={24} />
                          </ThemeIcon>
                          <Text fw={500} size="lg">{org.name}</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {org.description}
                        </Text>
                        <Button 
                          variant="light" 
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrganizationSelect(orgKey);
                          }}
                        >
                          View Projects
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}