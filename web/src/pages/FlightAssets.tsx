import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Card, 
  FileButton, 
  Progress, 
  Loader, 
  Center,
  Box,
  Paper,
  rem,
  Transition,
  ThemeIcon,
  Badge,
  Select
} from '@mantine/core';
import { 
  IconUpload, 
  IconPhoto, 
  IconInfoCircle,
  IconCheck,
  IconArrowRight,
  IconPlane,
  IconPlus
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { AssetGrid } from '../components/AssetGrid';
import { CreateFlightModal } from '../components/CreateFlightModal';

import { useAssets, useCreateAsset } from '../hooks/useAssetHooks';
import { useFlights, useFlight } from '../hooks/useFlightHooks';
import { useAuth } from '../contexts/AuthContext';

export function FlightAssets() {
  const navigate = useNavigate();
  const { flightId } = useParams<{ flightId?: string }>();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(flightId || null);
  const { user } = useAuth();
  
  // Modal controls
  const [createFlightOpened, { open: openCreateFlight, close: closeCreateFlight }] = useDisclosure(false);

  // Fetch all flights for dropdown
  const {
    data: flightsData = [],
    isLoading: flightsLoading
  } = useFlights();
  
  // Fetch specific flight if ID is provided
  const {
    data: flightData,
    isLoading: flightLoading
  } = useFlight(selectedFlightId || '');

  // Assets query based on selected flight
  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useAssets(selectedFlightId || undefined);

  // Mutation hook for asset upload
  const { mutateAsync: createAsset, isPending: isUploading } = useCreateAsset();

  // Update selected flight when URL param changes
  useEffect(() => {
    if (flightId) {
      setSelectedFlightId(flightId);
    }
  }, [flightId]);

  // Debug log assets
  useEffect(() => {
    console.log('assets', assets);
    console.log('selected flight', selectedFlightId);
  }, [assets, selectedFlightId]);

  const handleFileUpload = async (files: File[] | null) => {
    if (!files || !user || !selectedFlightId) {
      if (!selectedFlightId) {
        notifications.show({
          title: 'No Flight Selected',
          message: 'Please select or create a flight before uploading assets',
          color: 'yellow',
        });
      }
      return;
    }

    try {
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Upload the file using the createAsset hook
        await createAsset({ 
          file,
          flight_uuid: selectedFlightId
        });
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      // Refresh asset list
      refetchAssets();
      
      notifications.show({
        title: 'Success',
        message: `${files.length} asset${files.length === 1 ? '' : 's'} uploaded successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.error('Error uploading assets', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to upload assets',
        color: 'red',
      });
    } finally {
      setUploadProgress(0);
    }
  };
  console.log('flightsData', flightsData);
  // Flight dropdown options
  const flightOptions = flightsData.map(flight => ({
    value: flight.uuid,
    label: flight.name
  }));

  // Handle flight creation success
  const handleFlightCreated = (newFlightId: string) => {
    setSelectedFlightId(newFlightId);
    notifications.show({
      title: 'Flight Selected',
      message: 'Your new flight has been selected for asset uploads',
      color: 'blue',
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
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
                <Group gap="xs" align="center">
                  <Title order={2} c="white">Flight Assets</Title>
                  {flightData && (
                    <Badge color="blue" variant="light" size="lg">
                      {flightData.name}
                    </Badge>
                  )}
                </Group>
                <Text c="white" opacity={0.9} size="sm">Upload and manage observation data and images</Text>
              </Stack>
              <Group>
                <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      loading={isUploading}
                      variant="white"
                      radius="md"
                      disabled={!selectedFlightId}
                    >
                      Upload Assets
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Flight selection */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Title order={4}>Select Flight</Title>
            <Text size="sm" c="dimmed">
              Choose a flight to view or upload assets for, or create a new flight.
            </Text>
            
            <Group align="flex-end">
              <Select
                label="Flight"
                placeholder="Select a flight"
                data={flightOptions}
                value={selectedFlightId}
                onChange={setSelectedFlightId}
                searchable
                clearable
                style={{ flex: 1 }}
                disabled={flightsLoading}
              />
              
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={openCreateFlight}
                variant="light"
              >
                New Flight
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Upload progress */}
        <Transition mounted={isUploading} transition="slide-down" duration={400} timingFunction="ease">
          {(styles) => (
            <Card withBorder shadow="sm" p="md" radius="md" style={styles}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Uploading Assets...</Text>
                  <Text fw={600} size="sm" c="blue">{Math.round(uploadProgress)}%</Text>
                </Group>
                <Progress 
                  value={uploadProgress} 
                  size="md" 
                  radius="xl" 
                  color="blue"
                  striped
                  animated={uploadProgress < 100}
                />
              </Stack>
            </Card>
          )}
        </Transition>

        {/* Asset grid section - only show if flight is selected */}
        {selectedFlightId ? (
          <>
            {assetsLoading ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" size="sm">Loading assets...</Text>
                </Stack>
              </Center>
            ) : assetsError ? (
              <Card withBorder p="xl" radius="md" shadow="sm">
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} radius={100} color="red" variant="light">
                    <IconInfoCircle size={30} stroke={1.5} />
                  </ThemeIcon>
                  <Title order={3} ta="center">Failed to load assets</Title>
                  <Text c="dimmed" ta="center" maw={500} mx="auto">
                    We couldn't retrieve your asset data. Please try again or contact support if the problem persists.
                  </Text>
                  <Button 
                    onClick={() => refetchAssets()} 
                    variant="light" 
                    color="blue"
                    leftSection={<IconArrowRight size={16} />}
                    radius="md"
                  >
                    Retry
                  </Button>
                </Stack>
              </Card>
            ) : assets.data?.length === 0 ? (
              <Card withBorder p={40} radius="md" shadow="sm">
                <Stack align="center" gap="lg">
                  <ThemeIcon size={80} radius={100} color="blue" variant="light">
                    <IconPhoto size={40} stroke={1.5} />
                  </ThemeIcon>
                  <Stack gap="sm" align="center">
                    <Title order={2} ta="center">No Assets Yet</Title>
                    <Text ta="center" c="dimmed" maw={450} mx="auto">
                      Upload your first observation data or image to get started with your flight
                    </Text>
                  </Stack>
                  <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
                    {(props) => (
                      <Button
                        {...props}
                        variant="filled"
                        color="blue"
                        size="md"
                        radius="md"
                        leftSection={<IconUpload size={18} />}
                        loading={isUploading}
                      >
                        Upload Your First Asset
                      </Button>
                    )}
                  </FileButton>
                </Stack>
              </Card>
            ) : (
              <AssetGrid
                assets={assets.data || []}
                onView={(asset) => console.log('View asset', asset)}
                onDownload={(asset) => window.open(asset.download_url, '_blank')}
                onDelete={(asset) => console.log('Delete asset', asset)}
              />
            )}
          </>
        ) : (
          <Card withBorder p="xl" radius="md" shadow="sm">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius={100} color="blue" variant="light">
                <IconPlane size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={3} ta="center">Select a Flight</Title>
              <Text c="dimmed" ta="center" maw={500} mx="auto">
                Please select an existing flight or create a new one to view and manage assets.
              </Text>
              <Button 
                variant="light" 
                color="blue"
                leftSection={<IconPlus size={16} />}
                onClick={openCreateFlight}
              >
                Create New Flight
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Create Flight Modal */}
      <CreateFlightModal
        opened={createFlightOpened}
        onClose={closeCreateFlight}
        onSuccess={handleFlightCreated}
      />
    </Container>
  );
}