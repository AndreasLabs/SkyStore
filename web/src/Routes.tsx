import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import { MissionDashboard } from './pages/MissionDashboard';
import { MissionAssets } from './pages/MissionAssets';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';

import { Home } from './pages/Home';
import { useIsAuthenticated } from './hooks/useAuthHooks';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  
  // Show nothing while checking authentication status
  if (isLoading) {
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export function AppRoutes() {
  const { isAuthenticated } = useIsAuthenticated();
  
  return (
    <RouterRoutes>
      {/* Public routes - accessible without authentication */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />} />
      
      {/* Landing page - redirect to dashboard if authenticated */}
      <Route path="/" element={<Home />} />
      
      {/* Protected routes - require authentication */}
      <Route 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - shown when logged in */}
        <Route path="/dashboard" element={<Home />} />
        
        {/* Mission routes */}
        <Route path="/assets" element={<MissionAssets />} />
        
        {/* User routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </RouterRoutes>
  );
} 