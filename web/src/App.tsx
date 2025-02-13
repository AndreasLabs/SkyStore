import React from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './Routes';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const theme = createTheme({
  primaryColor: 'gray',
  components: {
    Paper: {
      defaultProps: {
        className: 'neo-glass',
      },
    },
    Card: {
      defaultProps: {
        className: 'neo-glass',
      },
    },
    Modal: {
      styles: {
        content: {
          background: 'rgba(18, 18, 18, 0.95) !important',
          backdropFilter: 'blur(30px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          background: 'transparent',
        },
        header: {
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(30px) saturate(200%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 32px 0 rgba(0, 0, 0, 0.45)',
        },
        navbar: {
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(30px) saturate(200%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '4px 0 32px 0 rgba(0, 0, 0, 0.45)',
        },
      },
    },
    Button: {
      defaultProps: {
        variant: 'filled',
      },
      styles: {
        root: {
          background: 'rgba(28, 28, 28, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          '&:hover': {
            background: 'rgba(38, 38, 38, 0.95)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
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