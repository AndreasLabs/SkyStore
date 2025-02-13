import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { CreateOrganization } from './pages/CreateOrganization';
import { CreateProject } from './pages/CreateProject';
import { CreateMission } from './pages/CreateMission';
import { SelectOrganization } from './pages/SelectOrganization';
import { SelectProject } from './pages/SelectProject';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { MissionDashboard } from './pages/MissionDashboard';
import { MissionAssets } from './pages/MissionAssets';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import Tasks from './pages/Tasks';
import { AppShell } from './components/AppShell';

export function AppRoutes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<Navigate to="/org" replace />} />
      
      <Route element={<AppShell />}>
        {/* Organization routes */}
        <Route path="/org" element={<SelectOrganization />} />
        <Route path="/org/create" element={<CreateOrganization />} />
        <Route path="/org/:organization" element={<SelectProject />} />
        
        {/* Project routes */}
        <Route path="/org/:organization/project/create" element={<CreateProject />} />
        <Route path="/org/:organization/project/:project" element={<ProjectDashboard />} />
        
        {/* Mission routes */}
        <Route path="/org/:organization/project/:project/mission/create" element={<CreateMission />} />
        <Route path="/org/:organization/project/:project/mission/:mission" element={<MissionDashboard />} />
        <Route path="/org/:organization/project/:project/mission/:mission/assets" element={<MissionAssets />} />
        <Route path="/org/:organization/project/:project/mission/:mission/tasks" element={<Tasks />} />
        
        {/* Settings routes */}
        <Route path="/org/:organization/project/:project/settings" element={<div>Project Settings</div>} />
        
        {/* User routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </RouterRoutes>
  );
} 