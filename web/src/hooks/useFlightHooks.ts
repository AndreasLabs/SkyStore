import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@skystore/core_types';
import { api } from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Query keys for flights
const flightKeys = {
  all: ['flights'] as const,
  lists: () => [...flightKeys.all, 'list'] as const,
  detail: (flightId: string) => [...flightKeys.all, 'detail', flightId] as const,
};

// Types
interface Flight {
  id: string;
  uuid: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  altitude: number;
  date: Date;
  aircraft: string;
  metadata?: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

interface CreateFlightData {
  name: string;
  aircraft: string;
  latitude: number;
  longitude: number;
  altitude: number;
  date: string;
  description: string;
  metadata?: Record<string, string>;
}

// API calls
const listFlights = async () => {
  const response = await api.flights.get({});
  return response.data.data;
};

const getFlight = async (flightId: string) => {
    console.log('getFlight', flightId);
  const response = await api.flights({id: flightId}).get();
  return response.data.data;
};

const createFlight = async (flightData: CreateFlightData) => {
  const response = await api.flights.post(flightData);
  return response.data.data;
};

const updateFlightMetadata = async (flightId: string, metadata: Record<string, string>) => {
  const response = await api.flights[':id'].metadata.patch({
    params: { id: flightId },
    body: metadata
  });
  return response.data.data;
};

// Hooks
export const useFlights = () => {
  return useQuery({
    queryKey: flightKeys.lists(),
    queryFn: () => listFlights(),
  });
};

export const useFlight = (flightId: string) => {
  return useQuery({
    queryKey: flightKeys.detail(flightId),
    queryFn: () => getFlight(flightId),
    enabled: !!flightId,
  });
};

export const useCreateFlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flightData: CreateFlightData) => createFlight(flightData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightKeys.lists() });
    }
  });
};

export const useUpdateFlightMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flightId, metadata }: { flightId: string; metadata: Record<string, string> }) => 
      updateFlightMetadata(flightId, metadata),
    onSuccess: (_, { flightId }) => {
      queryClient.invalidateQueries({ queryKey: flightKeys.detail(flightId) });
      queryClient.invalidateQueries({ queryKey: flightKeys.lists() });
    }
  });
};
