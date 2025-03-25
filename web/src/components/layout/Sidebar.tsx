import React from 'react';
import { NavLink, Stack, Text, Group } from '@mantine/core';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  IconHome,
  IconRocket,
  IconPhoto,
  IconSettings,
  IconChecklist,
  IconPlane,
} from '@tabler/icons-react';


interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  path: string;
  active: boolean;
  disabled?: boolean;
  selectedItem?: string;
  onClick: () => void;
}

function NavItem({ label, icon, active, disabled, selectedItem, onClick }: NavItemProps) {
  return (
    <NavLink
      label={
        <Group gap="xs">
          {icon}
          <Stack gap={0}>
            <Text size="sm">{label}</Text>
            {selectedItem && (
              <Text size="xs" c="dimmed" truncate>
                {selectedItem}
              </Text>
            )}
          </Stack>
        </Group>
      }
      active={active}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      icon: <IconHome size="1.2rem" />,
      path: `/dashboard`,
      active: location.pathname === `/dashboard`,
      onClick: () => navigate(`/dashboard`),
    },
  
    {
      label: 'Assets',
      icon: <IconPhoto size="1.2rem" />,
      path: `/assets`,
      active: location.pathname.includes('/assets'),
      onClick: () => navigate(`/assets`),
    },
    {
      label: 'Flights',
      icon: <IconPlane size="1.2rem" />,
      path: `/flights`,
      active: location.pathname.includes('/flights'),
      onClick: () => navigate(`/flights`),
    },
    {
      label: 'Settings',
      icon: <IconSettings size="1.2rem" />,
      path: `/settings`,
      active: location.pathname.endsWith('/settings'),
      onClick: () => navigate(`/settings`),
    },
  ];

  return (
    <Stack p="md">
      {navItems.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </Stack>
  );
} 