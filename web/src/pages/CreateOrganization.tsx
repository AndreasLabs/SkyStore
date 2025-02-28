import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, Textarea, Button, Paper, Title, Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateOrganization } from '../hooks/useOrganizationHooks';
import { CreateOrganizationBody } from '@skystore/core_types';
import adze from 'adze';

const log = new adze();

interface OrganizationFormValues {
  key: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export function CreateOrganization() {
  const navigate = useNavigate();
  const createOrganizationMutation = useCreateOrganization();

  const form = useForm<OrganizationFormValues>({
    initialValues: {
      key: '',
      name: '',
      description: '',
      metadata: {},
    },
    validate: {
      key: (value) => {
        if (!value) return 'Organization ID is required';
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
          log.warn('Invalid organization key format', { value });
          return 'Organization ID can only contain lowercase letters, numbers, and hyphens between parts';
        }
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
    },
  });

  const handleSubmit = (values: OrganizationFormValues) => {
    log.info('Submitting organization creation form', {
      key: values.key,
      name: values.name
    });

    createOrganizationMutation.mutate(
      {
        key: values.key,
        data: {
          uuid: crypto.randomUUID(),
          key: values.key,
          name: values.name,
          description: values.description,
          metadata: values.metadata,
        }
      },
      {
        onSuccess: () => {
          log.info('Organization created successfully', { key: values.key });
          notifications.show({
            title: 'Success',
            message: 'Organization created successfully',
            color: 'green',
          });
          navigate(`/org/${values.key}`);
        },
        onError: (error) => {
          log.error('Failed to create organization', { 
            key: values.key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          notifications.show({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to create organization',
            color: 'red',
          });
        }
      }
    );
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
              {...form.getInputProps('key')}
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
            <Button 
              type="submit" 
              loading={createOrganizationMutation.isPending}
            >
              Create Organization
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}