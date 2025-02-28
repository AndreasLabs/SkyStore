export interface Mission {
  uuid: string;
  key: string;
  name: string;
  location: string;
  date: string; // ISO string
  metadata: Record<string, string>;
}

export interface CreateMissionParams {
  organization_key: string;
  project_key: string;
  mission_key: string;
}

export interface CreateMissionBody extends Mission {} 