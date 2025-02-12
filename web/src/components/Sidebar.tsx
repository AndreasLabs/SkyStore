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
import { useOrganization } from '../api/hooks/useOrganizations';
import { useProject } from '../api/hooks/useProjects';
import { useMission } from '../api/hooks/useMissions';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization, project, mission } = useParams();

  // Fetch current item details
  const { data: orgData } = useOrganization(organization || undefined);
  const { data: projectData } = useProject(organization || undefined, project || undefined);
  const { data: missionData } = useMission(organization || '', project || '', mission || '');

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{ width: '240px', padding: '20px' }}>
      <NavLink
        label="Home"
        leftSection={<IconHome size="1.2rem" />}
        onClick={() => navigate('/')}
        active={location.pathname === '/'}
      />

      <NavLink
        label={
          <Stack gap={2}>
            <Text>Organizations</Text>
            {orgData && (
              <Text size="xs" c="dimmed" truncate>
                Selected: {orgData.name}
              </Text>
            )}
          </Stack>
        }
        leftSection={<IconBuilding size="1.2rem" />}
        onClick={() => navigate('/org')}
        active={location.pathname === '/org'}
      />

      {/* Organization-specific sections */}
      <NavLink
        label={
          <Stack gap={2}>
            <Text>Projects</Text>
            {projectData && (
              <Text size="xs" c="dimmed" truncate>
                Selected: {projectData.name}
              </Text>
            )}
          </Stack>
        }
        leftSection={<IconFolder size="1.2rem" />}
        onClick={() => organization && navigate(`/org/${organization}`)}
        active={Boolean(organization && !project && location.pathname.startsWith(`/org/${organization}`))}
        disabled={!organization}
        color={!organization ? 'gray' : undefined}
      />

      {/* Project-specific sections */}
      <NavLink
        label={
          <Stack gap={2}>
            <Text>Missions</Text>
            {missionData && (
              <Text size="xs" c="dimmed" truncate>
                Selected: {missionData.name}
              </Text>
            )}
          </Stack>
        }
        leftSection={<IconRocket size="1.2rem" />}
        onClick={() => {
          if (organization && project) {
            navigate(`/org/${organization}/project/${project}`);
          }
        }}
        active={Boolean(project && location.pathname.endsWith(`/project/${project}`))}
        disabled={!organization || !project}
        color={!organization || !project ? 'gray' : undefined}
      />

      {/* Mission-specific sections */}
      <NavLink
        label={
          <Stack gap={2}>
            <Text>Assets</Text>
            {missionData && (
              <Text size="xs" c="dimmed" truncate>
                Mission: {missionData.name}
              </Text>
            )}
          </Stack>
        }
        leftSection={<IconPhoto size="1.2rem" />}
        onClick={() => {
          if (organization && project && mission) {
            navigate(`/org/${organization}/project/${project}/mission/${mission}/assets`);
          }
        }}
        active={Boolean(mission && location.pathname.includes('/assets'))}
        disabled={!organization || !project || !mission}
        color={!organization || !project || !mission ? 'gray' : undefined}
      />

      <NavLink
        label="Settings"
        leftSection={<IconSettings size="1.2rem" />}
        onClick={() => {
          if (organization && project) {
            navigate(`/org/${organization}/project/${project}/settings`);
          }
        }}
        active={Boolean(project && location.pathname.endsWith('/settings'))}
        disabled={!organization || !project}
        color={!organization || !project ? 'gray' : undefined}
      />
    </div>
  );
} 