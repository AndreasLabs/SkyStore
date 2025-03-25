import { useState } from 'react';
import { 
  TextInput, 
  Textarea, 
  NumberInput, 
  Button, 
  Group, 
  Stack, 
  Paper, 
  Title, 
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPlane } from '@tabler/icons-react';
import { LocationPicker } from './LocationPicker';

interface FlightFormValues {
  name: string;
  aircraft: string;
  latitude: number;
  longitude: number;
  altitude: number;
  date: Date;
  description: string;
  location?: string;
}

interface FlightFormProps {
  initialValues?: Partial<FlightFormValues>;
  onSubmit: (values: FlightFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function FlightForm({ initialValues, onSubmit, onCancel, isSubmitting = false }: FlightFormProps) {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: initialValues?.latitude || 0,
    longitude: initialValues?.longitude || 0
  });

  const form = useForm<FlightFormValues>({
    initialValues: {
      name: initialValues?.name || '',
      aircraft: initialValues?.aircraft || '',
      latitude: initialValues?.latitude || 0,
      longitude: initialValues?.longitude || 0,
      altitude: initialValues?.altitude || 0,
      date: initialValues?.date || new Date(),
      description: initialValues?.description || '',
      location: initialValues?.location || `${initialValues?.latitude || 0},${initialValues?.longitude || 0}`,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      aircraft: (value) => (value.trim().length > 0 ? null : 'Aircraft is required'),
      altitude: (value) => (value >= 0 ? null : 'Altitude must be a positive number'),
    },
  });

  // Update form values when location string changes
  const handleLocationChange = (locationString: string) => {
    const [lat, lng] = locationString.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ latitude: lat, longitude: lng });
      form.setValues({ 
        latitude: lat, 
        longitude: lng,
        location: locationString 
      });
    }
  };

  const handleSubmit = async (values: FlightFormValues) => {
    try {
      await onSubmit(values);
      notifications.show({
        title: 'Success',
        message: 'Flight saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save flight',
        color: 'red',
      });
    }
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Title order={3}>Flight Information</Title>
          
          <TextInput
            required
            label="Flight Name"
            placeholder="Enter flight name"
            {...form.getInputProps('name')}
          />
          
          <TextInput
            required
            label="Aircraft"
            placeholder="Enter aircraft type/model"
            leftSection={<IconPlane size={16} />}
            {...form.getInputProps('aircraft')}
          />
          
          <DatePickerInput
            required
            label="Flight Date"
            placeholder="Select flight date"
            clearable={false}
            {...form.getInputProps('date')}
          />
          
          <Textarea
            label="Description"
            placeholder="Enter flight description"
            autosize
            minRows={3}
            maxRows={5}
            {...form.getInputProps('description')}
          />
          
          <Title order={4}>Location Information</Title>
          
          <LocationPicker
            value={form.values.location}
            onChange={handleLocationChange}
            label="Pick Location"
            description="Click on the map or enter coordinates manually"
          />
          
          <Group grow>
            <NumberInput
              required
              label="Latitude"
              precision={6}
              step={0.000001}
              {...form.getInputProps('latitude')}
              onChange={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                form.setFieldValue('latitude', numValue);
                setCoordinates(prev => ({ ...prev, latitude: numValue }));
                form.setFieldValue('location', `${numValue},${form.values.longitude}`);
              }}
            />
            
            <NumberInput
              required
              label="Longitude"
              precision={6}
              step={0.000001}
              {...form.getInputProps('longitude')}
              onChange={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                form.setFieldValue('longitude', numValue);
                setCoordinates(prev => ({ ...prev, longitude: numValue }));
                form.setFieldValue('location', `${form.values.latitude},${numValue}`);
              }}
            />
          </Group>
          
          <NumberInput
            required
            label="Altitude (meters)"
            min={0}
            step={10}
            {...form.getInputProps('altitude')}
          />
          
          <Group justify="flex-end" mt="xl">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={isSubmitting}>
              Save Flight
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
} 