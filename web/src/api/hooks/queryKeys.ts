// Query key factory
export const queryKeys = {
  organizations: {
    root: ['organizations'] as const,
    all: () => [...queryKeys.organizations.root, 'all'] as const,
    byId: (id: string) => [...queryKeys.organizations.root, 'detail', id] as const,
  },
  projects: {
    root: ['projects'] as const,
    all: (orgId: string) => [...queryKeys.projects.root, 'all', orgId] as const,
    byId: (orgId: string, id: string) => [...queryKeys.projects.root, 'detail', orgId, id] as const,
  },
  missions: {
    root: ['missions'] as const,
    all: (orgId: string, projectId: string) => 
      [...queryKeys.missions.root, 'all', orgId, projectId] as const,
    byId: (orgId: string, projectId: string, id: string) => 
      [...queryKeys.missions.root, 'detail', orgId, projectId, id] as const,
  },
  assets: {
    root: ['assets'] as const,
    all: (orgId: string, projectId: string, missionId: string) => 
      [...queryKeys.assets.root, 'all', orgId, projectId, missionId] as const,
    byId: (orgId: string, projectId: string, missionId: string, id: string) => 
      [...queryKeys.assets.root, 'detail', orgId, projectId, missionId, id] as const,
  },
} as const; 