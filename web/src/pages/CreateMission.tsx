import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextInput, Button, Paper, Title, Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface MissionFormValues {
  mission: string;
  name: string;
  location?: string;
  date?: string;
  metadata: {
    telescope?: string;
    target?: string;
    exposure_time?: string;
    weather_conditions?: string;
    observer?: string;
    priority?: string;
  };
}

export function CreateMission() {
  const navigate = useNavigate();
  const { organization, project } = useParams();

  const createMissionMutation = useMutation({
    mutationFn: async (values: MissionFormValues) => {
      if (!organization || !project) {
        throw new Error('No organization or project selected');
      }

      return apiClient.createMission({
        organization,
        project,
        mission: values.mission,
        name: values.name,
        location: values.location || '',
        date: values.date || new Date().toISOString(),
        metadata: {
          telescope: values.metadata.telescope || '',
          target: values.metadata.target || '',
          exposure_time: values.metadata.exposure_time || '',
          weather_conditions: values.metadata.weather_conditions || '',
          observer: values.metadata.observer || '',
          priority: values.metadata.priority || 'medium',
        },
      });
    },
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Success',
        message: 'Mission created successfully',
        color: 'green',
      });
      navigate(`/org/${organization}/project/${project}/mission/${variables.mission}`);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create mission',
        color: 'red',
      });
    },
  });

  const form = useForm<MissionFormValues>({
    initialValues: {
      mission: '',
      name: '',
      metadata: {},
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
    createMissionMutation.mutate(values);
  };

  return (
    <Container size="sm">
      <Paper shadow="xs" p="xl" mt="xl">
        <Title order={2} mb="lg">Create Mission</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Mission ID"
              placeholder="mission-2024-03"
              description="Unique identifier (lowercase letters, numbers, and hyphens only)"
              {...form.getInputProps('mission')}
            />
            <TextInput
              required
              label="Name"
              placeholder="March 2024 Observation"
              description="Display name for your mission"
              {...form.getInputProps('name')}
            />
            <Button 
              type="submit" 
              loading={createMissionMutation.isPending}
            >
              Create Mission
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 