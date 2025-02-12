import React from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './Routes';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

// Create custom theme
const theme = createTheme({
  primaryColor: 'gray',
  // Custom theme properties
  components: {
    Paper: {
      defaultProps: {
        className: 'glass-container',
      },
    },
    Card: {
      defaultProps: {
        className: 'glass-container',
      },
    },
    Modal: {
      styles: {
        content: {
          background: 'rgba(255, 255, 255, 0.08) !important',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          background: 'transparent',
        },
        header: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        navbar: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
    Button: {
      defaultProps: {
        variant: 'filled',
      },
      styles: {
        root: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#fff',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          },
        },
      },
    },
  },
});

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <Router>
        <AppRoutes />
      </Router>
    </MantineProvider>
  );
} 