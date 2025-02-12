import React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextInput, Textarea, Button, Paper, Title, Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../api/client';

interface ProjectFormValues {
  project: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export function CreateProject() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { organization } = useParams();

  const form = useForm<ProjectFormValues>({
    initialValues: {
      project: '',
      name: '',
      description: '',
      metadata: {},
    },
    validate: {
      project: (value) => {
        if (!value) return 'Project ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Project ID can only contain lowercase letters, numbers, and hyphens';
        return null;
      },
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
    },
  });

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!organization) {
      notifications.show({
        title: 'Error',
        message: 'No organization selected',
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.createProject(organization, values.project, {
        name: values.name,
        description: values.description,
        metadata: values.metadata,
      });
      notifications.show({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green',
      });
      navigate(`/org/${organization}/project/${values.project}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Paper shadow="xs" p="xl" mt="xl">
        <Title order={2} mb="lg">Create Project</Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Project ID"
              placeholder="my-project"
              description="Unique identifier (lowercase letters, numbers, and hyphens only)"
              {...form.getInputProps('project')}
            />
            <TextInput
              required
              label="Name"
              placeholder="My Project"
              description="Display name for your project"
              {...form.getInputProps('name')}
            />
            <Textarea
              required
              label="Description"
              placeholder="A brief description of your project"
              description="Help others understand what this project is about"
              minRows={3}
              {...form.getInputProps('description')}
            />
            <Button type="submit" loading={loading}>
              Create Project
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 