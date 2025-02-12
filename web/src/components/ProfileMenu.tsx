import React from 'react';
import { Menu, Avatar, Text, rem } from '@mantine/core';
import { IconSettings, IconLogout } from '@tabler/icons-react';

export function ProfileMenu() {
  return (
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
          leftSection={<IconSettings size={16} />}
        >
          Settings
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 