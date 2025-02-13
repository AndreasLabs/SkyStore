import React from 'react';
import { Menu, Avatar, Text, UnstyledButton, Group } from '@mantine/core';
import { IconSettings, IconLogout, IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// Mock user data - in real app this would come from auth context/API
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: null,
};

export function ProfileMenu() {
  const navigate = useNavigate();

  return (
    <Menu position="bottom-end" shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar
              src={mockUser.avatar}
              alt={mockUser.name}
              radius="xl"
              size="sm"
              color="blue"
            >
              {mockUser.name.charAt(0)}
            </Avatar>
            <Text size="sm" fw={500}>
              {mockUser.name}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Profile</Menu.Label>
        <Menu.Item>
          <Text size="sm" fw={500}>{mockUser.name}</Text>
          <Text size="xs" c="dimmed">{mockUser.email}</Text>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconUser size={16} />}
          onClick={() => navigate('/profile')}
        >
          Profile
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={() => navigate('/settings')}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => {
            // In real app, this would call logout API
            navigate('/');
          }}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 