import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './Routes';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

export default function App() {
  return (
    <MantineProvider>
      <Notifications />
      <Router>
        <AppRoutes />
      </Router>
    </MantineProvider>
  );
} 