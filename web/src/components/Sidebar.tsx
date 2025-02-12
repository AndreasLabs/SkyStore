import React from 'react';
import { NavLink, Stack, Text } from '@mantine/core';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  IconHome,
  IconBuilding,
  IconFolder,
  IconRocket,
  IconPhoto,
  IconSettings,
} from '@tabler/icons-react';
import { useOrganization, useProject, useMission } from '../api/hooks';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  path: string;
  active: boolean;
  disabled?: boolean;
  selectedItem?: string;
  onClick: () => void;
}

function NavItem({ label, icon, path, active, disabled, selectedItem, onClick }: NavItemProps) {
  return (
    <NavLink
      label={
        <Stack gap={2}>
          <Text>{label}</Text>
          {selectedItem && (
            <Text size="xs" c="dimmed" truncate>
              Selected: {selectedItem}
            </Text>
          )}
        </Stack>
      }
      leftSection={icon}
      onClick={onClick}
      active={active}
      disabled={disabled}
      color={disabled ? 'gray' : undefined}
    />
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization, project, mission } = useParams();

  const { data: orgData } = useOrganization(organization ?? '');
  const { data: projectData } = useProject(organization ?? '', project ?? '');
  const { data: missionData } = useMission(organization ?? '', project ?? '', mission ?? '');

  const navItems = [
    {
      label: 'Home',
      icon: <IconHome size="1.2rem" />,
      path: '/',
      active: location.pathname === '/',
      onClick: () => navigate('/'),
    },
    {
      label: 'Organizations',
      icon: <IconBuilding size="1.2rem" />,
      path: '/org',
      active: location.pathname === '/org',
      selectedItem: orgData?.name,
      onClick: () => navigate('/org'),
    },
    {
      label: 'Projects',
      icon: <IconFolder size="1.2rem" />,
      path: `/org/${organization}`,
      active: Boolean(organization && !project && location.pathname.startsWith(`/org/${organization}`)),
      disabled: !organization,
      selectedItem: projectData?.name,
      onClick: () => organization && navigate(`/org/${organization}`),
    },
    {
      label: 'Missions',
      icon: <IconRocket size="1.2rem" />,
      path: `/org/${organization}/project/${project}`,
      active: Boolean(project && location.pathname.endsWith(`/project/${project}`)),
      disabled: !organization || !project,
      selectedItem: missionData?.name,
      onClick: () => organization && project && navigate(`/org/${organization}/project/${project}`),
    },
    {
      label: 'Assets',
      icon: <IconPhoto size="1.2rem" />,
      path: `/org/${organization}/project/${project}/mission/${mission}/assets`,
      active: Boolean(mission && location.pathname.includes('/assets')),
      disabled: !organization || !project || !mission,
      selectedItem: missionData?.name,
      onClick: () => organization && project && mission && 
        navigate(`/org/${organization}/project/${project}/mission/${mission}/assets`),
    },
    {
      label: 'Settings',
      icon: <IconSettings size="1.2rem" />,
      path: `/org/${organization}/project/${project}/settings`,
      active: Boolean(project && location.pathname.endsWith('/settings')),
      disabled: !organization || !project,
      onClick: () => organization && project && 
        navigate(`/org/${organization}/project/${project}/settings`),
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