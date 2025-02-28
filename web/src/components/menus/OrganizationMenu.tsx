// @ts-nocheck
import React from 'react';
import { Menu, Button, Text, Group, Loader } from '@mantine/core';
import { IconBuildingSkyscraper, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../../hooks/useOrganizationHooks';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import adze from 'adze';

const log = new adze();

export function OrganizationMenu() {
  const navigate = useNavigate();
  const { data: organizations = [], isLoading, error } = useOrganizations();
  const { currentOrgKey, organization, setOrganization } = useCurrentOrganization();

  React.useEffect(() => {
    log.info('Organization menu state', {
      currentOrgKey,
      organizationCount: organizations.length,
      hasError: !!error,
      isLoading
    });
  }, [currentOrgKey, organizations.length, error, isLoading]);

  const handleOrganizationSelect = (orgKey: string) => {
    log.info('Organization selected', { 
      previousKey: currentOrgKey, 
      newKey: orgKey 
    });
    setOrganization(orgKey);
  };

  const handleCreateOrganization = () => {
    log.info('Navigating to create organization');
    navigate('/org/create');
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconBuildingSkyscraper size={16} />}
        >
          {organization?.name || 'Select Organization'}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Organizations</Menu.Label>
        {isLoading ? (
          <Menu.Item disabled>
            <Group justify="center">
              <Loader size="sm" />
            </Group>
          </Menu.Item>
        ) : error ? (
          <Menu.Item disabled color="red">
            <Text size="sm" c="red">Failed to load organizations</Text>
          </Menu.Item>
        ) : organizations.length === 0 ? (
          <Menu.Item disabled>
            <Text size="sm" c="dimmed">No organizations found</Text>
          </Menu.Item>
        ) : (
          organizations.map((org) => {
            // Handle both key and id fields
            const orgKey = org.key || org.id;
            return (
              <Menu.Item 
                key={orgKey}
                onClick={() => handleOrganizationSelect(orgKey)}
                data-active={orgKey === currentOrgKey}
              >
                <Text size="sm">{org.name}</Text>
              </Menu.Item>
            );
          })
        )}
        <Menu.Divider />
        <Menu.Item 
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateOrganization}
        >
          Create Organization
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 