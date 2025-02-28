import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextInput, Textarea, Button, Paper, Title, Container, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateProject } from '../hooks/useProjectHook';
import { useCurrentOrganization } from '../hooks/useCurrentOrganization';
import adze from 'adze';

const log = new adze();

interface ProjectFormValues {
  project: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

const PLACEHOLDER_OWNER_UUID = 'me';

export function CreateProject() {
  const navigate = useNavigate();
  const { organization } = useParams();
  const { organization: currentOrg, isLoading: isOrgLoading, error: orgError } = useCurrentOrganization();
  const createProjectMutation = useCreateProject();

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

  const handleSubmit = (values: ProjectFormValues) => {
    if (!organization) {
      notifications.show({
        title: 'Error',
        message: 'No organization selected',
        color: 'red',
      });
      return;
    }

    if (!currentOrg?.uuid) {
      notifications.show({
        title: 'Error',
        message: 'Organization UUID not available. Please try again.',
        color: 'red',
      });
      return;
    }

    createProjectMutation.mutate(
      {
        orgKey: organization,
        projectKey: values.project,
        data: {
          name: values.name,
          description: values.description,
          metadata: values.metadata,
          owner_uuid: PLACEHOLDER_OWNER_UUID,
          organization_uuid: currentOrg.uuid
        }
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Project created successfully',
            color: 'green',
          });
          navigate(`/org/${organization}/project/${values.project}`);
        },
        onError: (error) => {
          notifications.show({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to create project',
            color: 'red',
          });
        }
      }
    );
  };

  if (isOrgLoading) {
    return (
      <Container size="sm">
        <Paper shadow="xs" p="xl" mt="xl" pos="relative">
          <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <Title order={2} mb="lg">Loading Organization...</Title>
        </Paper>
      </Container>
    );
  }

  if (orgError) {
    return (
      <Container size="sm">
        <Alert title="Error" color="red" mt="xl">
          Failed to load organization data. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!currentOrg?.uuid) {
    return (
      <Container size="sm">
        <Alert title="Error" color="red" mt="xl">
          Organization data is not available. Please select a valid organization.
        </Alert>
      </Container>
    );
  }

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
            <Button type="submit" loading={createProjectMutation.isPending}>
              Create Project
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}