import React from 'react';
import { Menu, Avatar, Text, Group, ActionIcon, rem } from '@mantine/core';
import { IconSettings, IconLogout, IconBuilding } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { apiClient, Organization } from '../api/client';

export function ProfileMenu() {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const data = await apiClient.getOrganization('skyorg');
      setCurrentOrg(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load organization',
        color: 'red',
      });
    }
  };

  return (
    <Group gap="xs">
      <Menu position="bottom-end" shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg">
            <IconBuilding style={{ width: rem(20), height: rem(20) }} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Organization</Menu.Label>
          <Menu.Item>
            <Text size="sm" fw={500}>{currentOrg?.name || 'SkyOrg'}</Text>
            <Text size="xs" c="dimmed">{currentOrg?.description}</Text>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} />}>
            Settings
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Menu position="bottom-end" shadow="md" width={200}>
        <Menu.Target>
          <Avatar
            src={null}
            alt="Profile"
            radius="xl"
            size="md"
            color="blue"
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Profile</Menu.Label>
          <Menu.Item>
            <Text size="sm" fw={500}>John Doe</Text>
            <Text size="xs" c="dimmed">john@example.com</Text>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} />}
          >
            Settings
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} />}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
} 