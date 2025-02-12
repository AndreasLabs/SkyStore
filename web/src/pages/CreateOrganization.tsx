import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Textarea, Button, Paper, Title, Container, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../api/client';

interface OrganizationFormValues {
  organization: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export function CreateOrganization() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<OrganizationFormValues>({
    initialValues: {
      organization: '',
      name: '',
      description: '',
      metadata: {},
    },
    validate: {
      organization: (value) => {
        if (!value) return 'Organization ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Organization ID can only contain lowercase letters, numbers, and hyphens';
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
    },
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    try {
      setLoading(true);
      await apiClient.createOrganization(values.organization, {
        name: values.name,
        description: values.description,
        metadata: values.metadata,
      });
      notifications.show({
        title: 'Success',
        message: 'Organization created successfully',
        color: 'green',
      });
      navigate(`/org/${values.organization}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create organization',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Paper shadow="xs" p="xl" mt="xl">
        <Title order={2} mb="lg">Create Organization</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Organization ID"
              placeholder="my-organization"
              description="Unique identifier (lowercase letters, numbers, and hyphens only)"
              {...form.getInputProps('organization')}
            />
            <TextInput
              required
              label="Name"
              placeholder="My Organization"
              description="Display name for your organization"
              {...form.getInputProps('name')}
            />
            <Textarea
              required
              label="Description"
              placeholder="A brief description of your organization"
              description="Help others understand what this organization is about"
              minRows={3}
              {...form.getInputProps('description')}
            />
            <Button type="submit" loading={loading}>
              Create Organization
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 