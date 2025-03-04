import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import { MissionDashboard } from './pages/MissionDashboard';
import { MissionAssets } from './pages/MissionAssets';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

import { Home } from './pages/Home';

export function AppRoutes() {
  return (
    <RouterRoutes>
      {/* Landing page - only shown when not logged in */}
      <Route path="/" element={<Home />} />
      
      <Route element={<AppLayout />}>
        {/* Dashboard - shown when logged in */}
        <Route index element={<Navigate to="/dashboard" replace />} />
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