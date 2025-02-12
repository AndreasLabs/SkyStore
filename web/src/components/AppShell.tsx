import React from 'react';
import { AppShell as MantineAppShell, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function AppShell() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding="sm"
    >
      <MantineAppShell.Header>
        <TopNavbar />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <Sidebar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
} 