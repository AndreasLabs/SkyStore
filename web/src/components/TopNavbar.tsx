import React from 'react';
import { Group, Text, rem } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { ProfileMenu } from './ProfileMenu';
import { OrganizationMenu } from './menus/OrganizationMenu';
import { ProjectMenu } from './menus/ProjectMenu';

export function TopNavbar() {
  const navigate = useNavigate();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <IconRocket 
          size={30} 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }} 
        />
        <Text 
          size="lg" 
          fw={700} 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          SkyStore
        </Text>
        <OrganizationMenu />
        <ProjectMenu />
      </Group>
      <ProfileMenu />
    </Group>
  );
}