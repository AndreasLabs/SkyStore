import { useState } from 'react';
import { 
  Modal, 
  Stack,
  Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';

import { FlightForm } from './FlightForm';
import { useCreateFlight } from '../hooks/useFlightHooks';

interface CreateFlightModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (flightId: string) => void;
}

export function CreateFlightModal({ 
  opened, 
  onClose, 
  onSuccess 
}: CreateFlightModalProps) {
  const { mutateAsync: createFlight, isPending: isCreating } = useCreateFlight();

  const handleCreateFlight = async (values: any) => {
    try {
      // Format date as ISO string for API
      const formattedValues = {
        ...values,
        date: values.date.toISOString().split('T')[0],
      };

      const result = await createFlight(formattedValues);
      
      notifications.show({
        title: 'Success',
        message: 'Flight created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      onClose();
      
      // Call onSuccess callback with the new flight ID if provided
      if (onSuccess && result?.uuid) {
        onSuccess(result.uuid);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create flight',
        color: 'red',
      });
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title="Create New Flight"
      size="lg"
    >
      <FlightForm 
        onSubmit={handleCreateFlight}
        onCancel={onClose}
        isSubmitting={isCreating}
      />
    </Modal>
  );
} 