export interface Project {
  uuid: string;
  key: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  owner_uuid: string;
  organization_uuid: string;
  organization_key: string;
}

export interface CreateProjectParams {
  organization_key: string;
  project_key: string;
}

export interface CreateProjectBody extends Partial<Project> {}

export interface UpdateProjectBody extends Partial<Project> {} 