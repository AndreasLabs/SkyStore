import React from 'react';
import { Group, Text, rem } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileMenu } from './ProfileMenu';
import { OrganizationMenu } from './menus/OrganizationMenu';
import { ProjectMenu } from './menus/ProjectMenu';

export function TopNavbar() {
  const navigate = useNavigate();
  const { organization } = useParams();

  const handleLogoClick = () => {
    navigate('/org');
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <IconRocket 
          size={30} 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }} 
        />
        <Text 
          size="lg" 
          fw={700} 
          onClick={handleLogoClick}
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