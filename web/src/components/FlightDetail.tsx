import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Button, 
  Divider, 
  Grid, 
  Box,
  ThemeIcon,
  ActionIcon,
  Tooltip 
} from '@mantine/core';
import { 
  IconCalendar, 
  IconPlane, 
  IconMapPin, 
  IconRuler, 
  IconClock,
  IconEdit,
  IconPhoto,
  IconCloudUpload
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { AssetGrid } from './AssetGrid';
import { useNavigate } from 'react-router-dom';

interface Asset {
  id: string;
  name: string;
  file_type: string;
  thumbnail_url?: string;
  download_url: string;
}

interface FlightDetailProps {
  flight: {
    uuid: string;
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    altitude: number | null;
    aircraft: string;
    date: string | Date;
    created_at?: string | Date;
    updated_at?: string | Date;
  };
  assets?: Asset[];
  isLoadingAssets?: boolean;
  onEdit?: () => void;
  onAddAssets?: () => void;
}

export function FlightDetail({ 
  flight, 
  assets = [], 
  isLoadingAssets = false,
  onEdit,
  onAddAssets
}: FlightDetailProps) {
  const navigate = useNavigate();
  
  const formattedDate = flight.date instanceof Date 
    ? format(flight.date, 'MMMM d, yyyy')
    : format(new Date(flight.date), 'MMMM d, yyyy');
    
  const formattedCreatedAt = flight.created_at 
    ? (flight.created_at instanceof Date 
      ? format(flight.created_at, 'MMM d, yyyy h:mm a')
      : format(new Date(flight.created_at), 'MMM d, yyyy h:mm a'))
    : 'Unknown';

  return (
    <Stack gap="xl">
      <Paper 
        p="md" 
        radius="md" 
        shadow="xs"
        style={{ 
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
        
        <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2} c="white">{flight.name}</Title>
              <Text c="white" opacity={0.9} size="sm">{flight.description || 'No description provided'}</Text>
            </Stack>
            <Group>
              {onEdit && (
                <Button
                  variant="white"
                  leftSection={<IconEdit size={16} />}
                  onClick={onEdit}
                >
                  Edit Flight
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Paper>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder radius="md" p="md">
            <Stack gap="lg">
              <Title order={4}>Flight Details</Title>
              
              <Grid gutter="lg">
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
                      <IconPlane size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" c="dimmed">Aircraft</Text>
                      <Text fw={500}>{flight.aircraft}</Text>
                    </Stack>
                  </Group>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
                      <IconCalendar size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" c="dimmed">Flight Date</Text>
                      <Text fw={500}>{formattedDate}</Text>
                    </Stack>
                  </Group>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
                      <IconMapPin size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" c="dimmed">Coordinates</Text>
                      <Text fw={500}>{flight.latitude.toFixed(6)}, {flight.longitude.toFixed(6)}</Text>
                    </Stack>
                  </Group>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
                      <IconRuler size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" c="dimmed">Altitude</Text>
                      <Text fw={500}>{flight.altitude !== null ? `${flight.altitude} meters` : 'Not specified'}</Text>
                    </Stack>
                  </Group>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon color="gray" variant="light" size="lg" radius="xl">
                      <IconClock size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" c="dimmed">Created</Text>
                      <Text fw={500}>{formattedCreatedAt}</Text>
                    </Stack>
                  </Group>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Stack gap="lg" h="100%" justify="space-between">
              <Title order={4}>Map Location</Title>
              
              <Box 
                style={{ 
                  height: 200, 
                  background: '#f0f0f0', 
                  borderRadius: 'var(--mantine-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Placeholder for map component */}
                <Text c="dimmed">Map placeholder - Coordinates: {flight.latitude.toFixed(4)}, {flight.longitude.toFixed(4)}</Text>
              </Box>
              
              <Button 
                variant="light" 
                fullWidth
                leftSection={<IconMapPin size={16} />}
                component="a" 
                href={`https://www.google.com/maps?q=${flight.latitude},${flight.longitude}`}
                target="_blank"
              >
                View on Google Maps
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Stack gap="md">
        <Group position="apart">
          <Title order={3}>Flight Assets</Title>
          
          {onAddAssets && (
            <Button 
              variant="light" 
              leftSection={<IconCloudUpload size={16} />}
              onClick={onAddAssets}
            >
              Add Assets
            </Button>
          )}
        </Group>
        
        {assets.length === 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius={100} color="blue" variant="light">
                <IconPhoto size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={3} ta="center">No Assets Yet</Title>
              <Text c="dimmed" ta="center" maw={500} mx="auto">
                This flight doesn't have any assets yet. Upload observation data or images to get started.
              </Text>
              {onAddAssets && (
                <Button 
                  variant="filled" 
                  leftSection={<IconCloudUpload size={16} />}
                  onClick={onAddAssets}
                >
                  Upload First Asset
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <AssetGrid
            assets={assets}
            onView={(asset) => console.log('View asset', asset)}
            onDownload={(asset) => window.open(asset.download_url, '_blank')}
            onDelete={(asset) => console.log('Delete asset', asset)}
          />
        )}
      </Stack>
    </Stack>
  );
} 