import React, { useState } from 'react';
import { Menu, Text, UnstyledButton, Group, Loader, Modal, TextInput, Button, Stack } from '@mantine/core';
import { IconChevronDown, IconPlus } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useProjects, useCreateProject } from '../../api/hooks';

interface CreateProjectForm {
  name: string;
  description: string;
  project: string;
}

export function ProjectMenu() {
  const navigate = useNavigate();
  const { organization: urlOrg, project: urlProject } = useParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const form = useForm<CreateProjectForm>({
    initialValues: { name: '', description: '', project: '' },
    validate: {
      name: (value) => !value ? 'Name is required' : null,
      description: (value) => !value ? 'Description is required' : null,
      project: (value) => {
        if (!value) return 'Project ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Project ID can only contain lowercase letters, numbers, and hyphens';
        }
        return null;
      },
    },
  });

  const { data: projects = [], isLoading, error } = useProjects(urlOrg ?? '');
  const currentProject = projects.find(p => p.key === urlProject);
  const createProjectMutation = useCreateProject();

  const handleCreateProject = async (values: CreateProjectForm) => {
    if (!urlOrg) {
      notifications.show({
        title: 'Error',
        message: 'Please select an organization first',
        color: 'red',
      });
      return;
    }

    createProjectMutation.mutate(
      {
        organization: urlOrg,
        id: values.project,
        data: {
          key: values.project,
          name: values.name,
          description: values.description,
          metadata: {}
        }
      },
      {
        onSuccess: () => {
          form.reset();
          setCreateModalOpen(false);
          navigate(`/org/${urlOrg}/project/${values.project}`);
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

  if (!urlOrg) return null;

  return (
    <>
      <Menu position="bottom-start" shadow="md" width={220}>
        <Menu.Target>
          <UnstyledButton>
            <Group gap={3}>
              <Text size="sm" fw={500}>
                {currentProject?.name || 'Select Project'}
              </Text>
              <IconChevronDown size={16} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Projects</Menu.Label>
          {isLoading ? (
            <Menu.Item disabled><Group justify="center"><Loader size="sm" /></Group></Menu.Item>
          ) : error ? (
            <Menu.Item disabled color="red"><Text size="sm" c="red">Failed to load projects</Text></Menu.Item>
          ) : projects.length === 0 ? (
            <Menu.Item disabled><Text size="sm" c="dimmed">No projects found</Text></Menu.Item>
          ) : (
            projects.map((project) => (
              <Menu.Item
                key={project.key}
                onClick={() => navigate(`/org/${urlOrg}/project/${project.key}`, { replace: true })}
                color={currentProject?.key === project.key ? 'blue' : undefined}
              >
                <Text size="sm">{project.name}</Text>
              </Menu.Item>
            ))
          )}
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Project
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal 
        opened={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        title="Create New Project"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleCreateProject)}>
          <Stack>
            <TextInput
              label="Project ID"
              placeholder="my-project"
              description="Unique identifier for your project (lowercase letters, numbers, and hyphens only)"
              required
              {...form.getInputProps('project')}
            />
            <TextInput
              label="Name"
              placeholder="My Awesome Project"
              description="Display name for your project"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Description"
              placeholder="A brief description of your project"
              description="Help others understand what this project is about"
              required
              {...form.getInputProps('description')}
            />
            <Button 
              type="submit" 
              loading={createProjectMutation.isPending}
            >
              Create Project
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
} 