import { SimpleGrid, Center, Text, Stack, Loader } from '@mantine/core';
import { FlightCard } from './FlightCard';

interface Flight {
  uuid: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  aircraft: string;
  date: string | Date;
}

interface FlightGridProps {
  flights: Flight[];
  isLoading?: boolean;
  onViewFlight: (flightId: string) => void;
  onEditFlight?: (flightId: string) => void;
  onDeleteFlight?: (flightId: string) => void;
}

export function FlightGrid({ 
  flights, 
  isLoading = false, 
  onViewFlight, 
  onEditFlight, 
  onDeleteFlight 
}: FlightGridProps) {
  if (isLoading) {
    return (
      <Center p="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text c="dimmed" size="sm">Loading flights...</Text>
        </Stack>
      </Center>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <Center p="xl">
        <Text c="dimmed">No flights found</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
      spacing={{ base: 'md', sm: 'lg' }}
    >
      {flights.map((flight) => (
        <FlightCard
          key={flight.uuid}
          flight={flight}
          onView={onViewFlight}
          onEdit={onEditFlight}
          onDelete={onDeleteFlight}
        />
      ))}
    </SimpleGrid>
  );
} 