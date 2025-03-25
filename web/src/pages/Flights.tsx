import { useState } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Card, 
  Loader, 
  Center,
  Box,
  Paper,
  ThemeIcon,
  Tabs,
  Modal
} from '@mantine/core';
import { 
  IconPlus, 
  IconInfoCircle,
  IconCheck,
  IconArrowRight,
  IconPlane,
  IconListDetails
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import { FlightGrid } from '../components/FlightGrid';
import { FlightForm } from '../components/FlightForm';
import { FlightDetail } from '../components/FlightDetail';

import { useFlights, useCreateFlight } from '../hooks/useFlightHooks';
import { useAuth } from '../contexts/AuthContext';

export function Flights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  
  // Modal controls
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);

  // Get flights data
  const {
    data: flightsData = [],
    isLoading: flightsLoading,
    error: flightsError,
    refetch: refetchFlights
  } = useFlights();

  // Flight creation mutation
  const { mutateAsync: createFlight, isPending: isCreating } = useCreateFlight();

  // Find the selected flight from the flights data
  const selectedFlight = selectedFlightId 
    ? flightsData.find(flight => flight.uuid === selectedFlightId) 
    : null;

  // Handle flight creation
  const handleCreateFlight = async (values: any) => {
    if (!user) return;

    try {
      // Format date as ISO string for API
      const formattedValues = {
        ...values,
        date: values.date.toISOString().split('T')[0],
      };

      await createFlight(formattedValues);
      
      notifications.show({
        title: 'Success',
        message: 'Flight created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      closeCreateModal();
      refetchFlights();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create flight',
        color: 'red',
      });
    }
  };

  // Handle flight view
  const handleViewFlight = (flightId: string) => {
    setSelectedFlightId(flightId);
    openViewModal();
  };

  // Navigate to Flight Assets page
  const handleViewAssets = (flightId: string) => {
    navigate(`/flight-assets/${flightId}`);
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
                <Title order={2} c="white">Flights</Title>
                <Text c="white" opacity={0.9} size="sm">Manage your observation flights and missions</Text>
              </Stack>
              <Group>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={openCreateModal}
                  variant="white"
                  radius="md"
                >
                  New Flight
                </Button>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Tab navigation */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<IconListDetails size={16} />}>
              All Flights
            </Tabs.Tab>
            <Tabs.Tab value="recent" leftSection={<IconPlane size={16} />}>
              Recent Flights
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="all" pt="md">
            {/* Loading, error, or empty states */}
            {flightsLoading ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" size="sm">Loading flights...</Text>
                </Stack>
              </Center>
            ) : flightsError ? (
              <Card withBorder p="xl" radius="md" shadow="sm">
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} radius={100} color="red" variant="light">
                    <IconInfoCircle size={30} stroke={1.5} />
                  </ThemeIcon>
                  <Title order={3} ta="center">Failed to load flights</Title>
                  <Text c="dimmed" ta="center" maw={500} mx="auto">
                    We couldn't retrieve your flight data. Please try again or contact support if the problem persists.
                  </Text>
                  <Button 
                    onClick={() => refetchFlights()} 
                    variant="light" 
                    color="blue"
                    leftSection={<IconArrowRight size={16} />}
                    radius="md"
                  >
                    Retry
                  </Button>
                </Stack>
              </Card>
            ) : flightsData.length === 0 ? (
              <Card withBorder p={40} radius="md" shadow="sm">
                <Stack align="center" gap="lg">
                  <ThemeIcon size={80} radius={100} color="blue" variant="light">
                    <IconPlane size={40} stroke={1.5} />
                  </ThemeIcon>
                  <Stack gap="sm" align="center">
                    <Title order={2} ta="center">No Flights Yet</Title>
                    <Text ta="center" c="dimmed" maw={450} mx="auto">
                      Create your first flight to start organizing your observation data
                    </Text>
                  </Stack>
                  <Button
                    variant="filled"
                    color="blue"
                    size="md"
                    radius="md"
                    leftSection={<IconPlus size={18} />}
                    onClick={openCreateModal}
                  >
                    Create Your First Flight
                  </Button>
                </Stack>
              </Card>
            ) : (
              <FlightGrid
                flights={flightsData}
                onViewFlight={handleViewFlight}
                onEditFlight={(id) => console.log('Edit flight', id)}
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="recent" pt="md">
            <FlightGrid
              flights={flightsData.slice(0, 5)}
              onViewFlight={handleViewFlight}
              onEditFlight={(id) => console.log('Edit flight', id)}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Create Flight Modal */}
      <Modal 
        opened={createModalOpened} 
        onClose={closeCreateModal}
        title="Create New Flight"
        size="lg"
      >
        <FlightForm 
          onSubmit={handleCreateFlight}
          onCancel={closeCreateModal}
          isSubmitting={isCreating}
        />
      </Modal>

      {/* View Flight Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title="Flight Details"
        size="xl"
        fullScreen
      >
        {selectedFlight && (
          <FlightDetail
            flight={selectedFlight}
            onEdit={() => console.log('Edit flight', selectedFlight.uuid)}
            onAddAssets={() => handleViewAssets(selectedFlight.uuid)}
          />
        )}
      </Modal>
    </Container>
  );
} 