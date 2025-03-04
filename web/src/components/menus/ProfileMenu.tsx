import { Menu, Avatar, Text, UnstyledButton, Group, Skeleton } from '@mantine/core';
import { IconSettings, IconLogout, IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuthHooks';

export function ProfileMenu() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { mutate: logoutMutation, isPending: isLoggingOut } = useLogout();
  
  const handleLogout = () => {
    logoutMutation(undefined, {
      onSuccess: () => {
        navigate('/login');
      }
    });
  };

  if (isLoading) {
    return (
      <Group gap="xs">
        <Skeleton height={30} circle />
        <Skeleton height={20} width={100} />
      </Group>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <UnstyledButton onClick={() => navigate('/login')}>
        <Text size="sm" fw={500}>Login</Text>
      </UnstyledButton>
    );
  }

  // Create display name from user data
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.username;

  return (
    <Menu position="bottom-end" shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar
              src={null} // We could add avatar url to the user object if needed
              alt={displayName}
              radius="xl"
              size="sm"
              color="blue"
            >
              {displayName.charAt(0)}
            </Avatar>
            <Text size="sm" fw={500}>
              {displayName}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Profile</Menu.Label>
        <Menu.Item>
          <Text size="sm" fw={500}>{displayName}</Text>
          <Text size="xs" c="dimmed">{user.email}</Text>
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
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
} 