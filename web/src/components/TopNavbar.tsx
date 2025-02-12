import React from 'react';
import { Group, Menu, Text, UnstyledButton, rem, Loader, Modal, TextInput, Button, Stack } from '@mantine/core';
import { IconChevronDown, IconRocket, IconPlus, IconBuilding } from '@tabler/icons-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileMenu } from './ProfileMenu';
import { Project, Organization } from '../api/client';
import { useOrganizations, useProjects, useCreateProject } from '../api/hooks';

interface CreateProjectForm {
  name: string;
  description: string;
  project: string;
}

export function TopNavbar() {
  const navigate = useNavigate();
  const { organization: urlOrg, project: urlProject } = useParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const form = useForm<CreateProjectForm>({
    initialValues: {
      name: '',
      description: '',
      project: '',
    },
    validate: {
      name: (value) => !value ? 'Name is required' : null,
      description: (value) => !value ? 'Description is required' : null,
      project: (value) => {
        if (!value) return 'Project ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Project ID can only contain lowercase letters, numbers, and hyphens';
        return null;
      },
    },
  });

  const { data: organizations = [], isLoading: orgsLoading, error: orgsError } = useOrganizations();
  const currentOrganization = organizations.find(o => o.key === urlOrg);
  
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects(currentOrganization?.key);
  const currentProject = projects.find(p => p.key === urlProject);

  const createProjectMutation = useCreateProject();

  const handleOrganizationSelect = (org: Organization) => {
    if (org.name !== urlOrg) {
      navigate(`/org/${org.key}`, { replace: true });
    }
  };

  const handleProjectSelect = (project: Project) => {
    if (currentOrganization && project.key !== urlProject) {
      navigate(`/org/${currentOrganization.key}/project/${project.key}`, { replace: true });
    }
  };

  const handleCreateProject = async (values: CreateProjectForm) => {
    if (!currentOrganization) {
      notifications.show({
        title: 'Error',
        message: 'Please select an organization first',
        color: 'red',
      });
      return;
    }

    createProjectMutation.mutate(
      {
        organization: currentOrganization.name,
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
          navigate(`/org/${currentOrganization.name}/project/${values.project}`);
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

  return (
    <>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <IconRocket size={30} onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          <Text size="lg" fw={700} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SkyStore</Text>

          <Menu position="bottom-start" shadow="md" width={220}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap={3}>
                  <IconBuilding style={{ width: rem(16), height: rem(16) }} />
                  <Text size="sm" fw={500}>
                    {currentOrganization?.name || 'Select Organization'}
                  </Text>
                  <IconChevronDown style={{ width: rem(16), height: rem(16) }} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Organizations</Menu.Label>
              {orgsLoading ? (
                <Menu.Item disabled><Group justify="center"><Loader size="sm" /></Group></Menu.Item>
              ) : orgsError ? (
                <Menu.Item disabled color="red"><Text size="sm" c="red">Failed to load organizations</Text></Menu.Item>
              ) : organizations.length === 0 ? (
                <Menu.Item disabled><Text size="sm" c="dimmed">No organizations found</Text></Menu.Item>
              ) : (
                organizations.map((org) => (
                  <Menu.Item key={org.name} onClick={() => handleOrganizationSelect(org)}>
                    <Text size="sm">{org.name}</Text>
                  </Menu.Item>
                ))
              )}
              <Menu.Divider />
              <Menu.Item onClick={() => navigate('/org/create')} leftSection={<IconPlus style={{ width: rem(16), height: rem(16) }} />}>
                Create Organization
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {currentOrganization && (
            <Menu position="bottom-start" shadow="md" width={220}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={3}>
                    <Text size="sm" fw={500}>{currentProject?.name || 'Select Project'}</Text>
                    <IconChevronDown style={{ width: rem(16), height: rem(16) }} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Projects</Menu.Label>
                {projectsLoading ? (
                  <Menu.Item disabled><Group justify="center"><Loader size="sm" /></Group></Menu.Item>
                ) : projectsError ? (
                  <Menu.Item disabled color="red"><Text size="sm" c="red">Failed to load projects</Text></Menu.Item>
                ) : projects.length === 0 ? (
                  <Menu.Item disabled><Text size="sm" c="dimmed">No projects found</Text></Menu.Item>
                ) : (
                  projects.map((project) => (
                    <Menu.Item
                      key={project.name}
                      onClick={() => handleProjectSelect(project)}
                      color={currentProject?.name === project.name ? 'blue' : undefined}
                    >
                      <Text size="sm">{project.name}</Text>
                    </Menu.Item>
                  ))
                )}
                <Menu.Divider />
                <Menu.Item leftSection={<IconPlus style={{ width: rem(16), height: rem(16) }} />} onClick={() => setCreateModalOpen(true)}>
                  Create Project
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        <ProfileMenu />
      </Group>

      <Modal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Project" size="md">
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
            <Button type="submit" loading={createProjectMutation.isPending}>Create Project</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}