import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextInput, Button, Paper, Title, Container, Stack, Select, Grid, NumberInput, Divider, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateMission } from '../hooks/useMissionHooks';
import { LocationPicker } from '../components/LocationPicker';

interface MissionFormValues {
  mission: string;
  name: string;
  location: string;
  date: string;
  metadata: {
    // Equipment
    platform: string;
    camera: string;
    lens: string;
    telescope: string;
    
    // Target
    target: string;
    target_type: string;
    
    // Flight Parameters
    altitude: string;
    overlap_percent: string;
    sidelap_percent: string;
    ground_resolution: string;
    
    // Capture Settings
    exposure_time: string;
    iso: string;
    aperture: string;
    
    // Conditions
    weather_conditions: string;
    visibility: string;
    wind_speed: string;
    temperature: string;
    
    // Additional Info
    observer: string;
    priority: string;
    notes: string;
  };
}

export function CreateMission() {
  const navigate = useNavigate();
  const { organization: orgKey, project: projectKey } = useParams();

  const createMissionMutation = useCreateMission();

  const form = useForm<MissionFormValues>({
    initialValues: {
      mission: '',
      name: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      metadata: {
        // Equipment
        platform: '',
        camera: '',
        lens: '',
        telescope: '',
        
        // Target
        target: '',
        target_type: '',
        
        // Flight Parameters
        altitude: '100',
        overlap_percent: '75',
        sidelap_percent: '60',
        ground_resolution: '2.5',
        
        // Capture Settings
        exposure_time: '',
        iso: '',
        aperture: '',
        
        // Conditions
        weather_conditions: '',
        visibility: '',
        wind_speed: '',
        temperature: '',
        
        // Additional Info
        observer: '',
        priority: 'medium',
        notes: '',
      },
    },
    validate: {
      mission: (value) => {
        if (!value) return 'Mission ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Mission ID can only contain lowercase letters, numbers, and hyphens';
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
    },
  });

  const handleSubmit = (values: MissionFormValues) => {
    if (!orgKey || !projectKey) {
      notifications.show({
        title: 'Error',
        message: 'No organization or project selected',
        color: 'red',
      });
      return;
    }

    createMissionMutation.mutate(
      {
        orgKey,
        projectKey,
        missionKey: values.mission,
        data: {
          name: values.name,
          location: values.location,
          date: values.date || new Date().toISOString(),
          metadata: {
            // Equipment
            platform: values.metadata.platform || '',
            camera: values.metadata.camera || '',
            lens: values.metadata.lens || '',
            telescope: values.metadata.telescope || '',
            
            // Target
            target: values.metadata.target || '',
            target_type: values.metadata.target_type || '',
            
            // Flight Parameters
            altitude: values.metadata.altitude || '',
            overlap_percent: values.metadata.overlap_percent || '',
            sidelap_percent: values.metadata.sidelap_percent || '',
            ground_resolution: values.metadata.ground_resolution || '',
            
            // Capture Settings
            exposure_time: values.metadata.exposure_time || '',
            iso: values.metadata.iso || '',
            aperture: values.metadata.aperture || '',
            
            // Conditions
            weather_conditions: values.metadata.weather_conditions || '',
            visibility: values.metadata.visibility || '',
            wind_speed: values.metadata.wind_speed || '',
            temperature: values.metadata.temperature || '',
            
            // Additional Info
            observer: values.metadata.observer || '',
            priority: values.metadata.priority || 'medium',
            notes: values.metadata.notes || '',
          }
        }
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Mission created successfully',
            color: 'green',
          });
          navigate(`/org/${orgKey}/project/${projectKey}/mission/${values.mission}`);
        },
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to create mission',
            color: 'red',
          });
        }
      }
    );
  };

  return (
    <Container size="md" py="xl">
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xl">
            <Title order={2}>Create Mission</Title>

            {/* Basic Information */}
            <Stack gap="md">
              <Text fw={500} size="lg">Basic Information</Text>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Mission ID"
                    placeholder="my-awesome-mission"
                    required
                    {...form.getInputProps('mission')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Name"
                    placeholder="My Awesome Mission"
                    required
                    {...form.getInputProps('name')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <LocationPicker
                    label="Location"
                    description="Click on the map or enter coordinates manually"
                    {...form.getInputProps('location')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    type="date"
                    label="Date"
                    {...form.getInputProps('date')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Priority"
                    placeholder="Select priority"
                    data={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    {...form.getInputProps('metadata.priority')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Equipment */}
            <Stack gap="md">
              <Text fw={500} size="lg">Equipment</Text>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Platform/UAV"
                    placeholder="e.g. DJI Mavic 3"
                    {...form.getInputProps('metadata.platform')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Camera"
                    placeholder="e.g. Hasselblad L2D-20c"
                    {...form.getInputProps('metadata.camera')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Lens"
                    placeholder="e.g. 24mm f/2.8"
                    {...form.getInputProps('metadata.lens')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Telescope"
                    placeholder="Optional telescope used"
                    {...form.getInputProps('metadata.telescope')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Target Information */}
            <Stack gap="md">
              <Text fw={500} size="lg">Target Information</Text>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Target"
                    placeholder="Name or description of target"
                    {...form.getInputProps('metadata.target')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Target Type"
                    placeholder="Select target type"
                    data={[
                      { value: 'area', label: 'Area Survey' },
                      { value: 'structure', label: 'Structure' },
                      { value: 'celestial', label: 'Celestial Object' },
                      { value: 'other', label: 'Other' },
                    ]}
                    {...form.getInputProps('metadata.target_type')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Flight Parameters */}
            <Stack gap="md">
              <Text fw={500} size="lg">Flight Parameters</Text>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Flight Altitude (m)"
                    placeholder="100"
                    {...form.getInputProps('metadata.altitude')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Ground Resolution (cm/px)"
                    placeholder="2.5"
                    {...form.getInputProps('metadata.ground_resolution')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Forward Overlap (%)"
                    placeholder="75"
                    {...form.getInputProps('metadata.overlap_percent')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Side Overlap (%)"
                    placeholder="60"
                    {...form.getInputProps('metadata.sidelap_percent')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Capture Settings */}
            <Stack gap="md">
              <Text fw={500} size="lg">Capture Settings</Text>
              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="Exposure Time"
                    placeholder="e.g. 1/500"
                    {...form.getInputProps('metadata.exposure_time')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="ISO"
                    placeholder="e.g. 100"
                    {...form.getInputProps('metadata.iso')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Aperture"
                    placeholder="e.g. f/2.8"
                    {...form.getInputProps('metadata.aperture')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Environmental Conditions */}
            <Stack gap="md">
              <Text fw={500} size="lg">Environmental Conditions</Text>
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Weather Conditions"
                    placeholder="Select conditions"
                    data={[
                      { value: 'clear', label: 'Clear' },
                      { value: 'partly_cloudy', label: 'Partly Cloudy' },
                      { value: 'cloudy', label: 'Cloudy' },
                      { value: 'overcast', label: 'Overcast' },
                    ]}
                    {...form.getInputProps('metadata.weather_conditions')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Visibility"
                    placeholder="Select visibility"
                    data={[
                      { value: 'excellent', label: 'Excellent' },
                      { value: 'good', label: 'Good' },
                      { value: 'fair', label: 'Fair' },
                      { value: 'poor', label: 'Poor' },
                    ]}
                    {...form.getInputProps('metadata.visibility')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Wind Speed"
                    placeholder="e.g. 5 km/h"
                    {...form.getInputProps('metadata.wind_speed')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Temperature"
                    placeholder="e.g. 20°C"
                    {...form.getInputProps('metadata.temperature')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Divider />

            {/* Additional Information */}
            <Stack gap="md">
              <Text fw={500} size="lg">Additional Information</Text>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Observer"
                    placeholder="Name of the observer"
                    {...form.getInputProps('metadata.observer')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Notes"
                    placeholder="Additional notes or comments"
                    {...form.getInputProps('metadata.notes')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>

            <Button 
              type="submit" 
              loading={createMissionMutation.isPending}
              size="lg"
              fullWidth
            >
              Create Mission
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}