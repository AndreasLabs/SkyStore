export interface Organization {
  uuid: string;
  key: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateOrganizationParams {
  organization_key: string;
}

export interface CreateOrganizationBody {
  name: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface UpdateOrganizationBody extends Partial<Organization> {} 