import React from 'react';
import { AppShell as MantineAppShell } from '@mantine/core';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function AppShell() {
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