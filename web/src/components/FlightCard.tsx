import { 
  Card, 
  Image, 
  Text, 
  Badge, 
  Group, 
  Stack,
  Button,
  ActionIcon,
  ThemeIcon,
  Box
} from '@mantine/core';
import { 
  IconCalendar, 
  IconPlane, 
  IconMapPin, 
  IconEye, 
  IconPencil, 
  IconTrash
} from '@tabler/icons-react';
import { format } from 'date-fns';

interface FlightCardProps {
  flight: {
    uuid: string;
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    altitude: number | null;
    aircraft: string;
    date: string | Date;
  };
  onView: (flightId: string) => void;
  onEdit?: (flightId: string) => void;
  onDelete?: (flightId: string) => void;
}

export function FlightCard({ flight, onView, onEdit, onDelete }: FlightCardProps) {
  const formattedDate = flight.date instanceof Date 
    ? format(flight.date, 'MMM d, yyyy')
    : format(new Date(flight.date), 'MMM d, yyyy');

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Box 
          style={{ 
            height: 140, 
            background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-indigo-5))',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 70%)',
              zIndex: 0
            }} 
          />
          <Group justify="center" align="center" style={{ height: '100%', position: 'relative', zIndex: 1 }}>
            <ThemeIcon size={60} radius={30} color="white" variant="light">
              <IconPlane size={30} />
            </ThemeIcon>
          </Group>
        </Box>
      </Card.Section>

      <Stack mt="md" mb="xs" gap="xs">
        <Text fw={700} size="lg" truncate>{flight.name}</Text>
        
        <Text size="sm" c="dimmed" lineClamp={2}>
          {flight.description || 'No description provided'}
        </Text>

        <Group gap="xs">
          <Badge 
            color="indigo" 
            radius="sm" 
            leftSection={<IconPlane size={14} />}
          >
            {flight.aircraft}
          </Badge>
          
          <Badge 
            color="blue" 
            radius="sm" 
            leftSection={<IconCalendar size={14} />}
          >
            {formattedDate}
          </Badge>
          
          <Badge 
            color="cyan" 
            radius="sm" 
            leftSection={<IconMapPin size={14} />}
          >
            {flight.latitude.toFixed(2)}, {flight.longitude.toFixed(2)}
          </Badge>
        </Group>
      </Stack>

      <Group mt="md" justify="space-between">
        <Button 
          variant="light" 
          color="blue" 
          radius="md"
          leftSection={<IconEye size={16} />}
          onClick={() => onView(flight.uuid)}
        >
          View Details
        </Button>
        
        <Group gap="xs">
          {onEdit && (
            <ActionIcon 
              variant="subtle" 
              color="gray"
              onClick={() => onEdit(flight.uuid)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          )}
          
          {onDelete && (
            <ActionIcon 
              variant="subtle" 
              color="red"
              onClick={() => onDelete(flight.uuid)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Card>
  );
} 