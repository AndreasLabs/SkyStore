export interface Flight {
  uuid: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  aircraft: string;
  date: Date;
}

export interface CreateFlightParams {
  name: string;
  flight_key: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  aircraft: string;
  date: Date;
}

export interface CreateFlightBody extends Flight {} 