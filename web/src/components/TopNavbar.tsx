import React from 'react';
import { Group, Menu, Text, UnstyledButton, rem, Loader, Modal, TextInput, Button, Stack, Divider } from '@mantine/core';
import { IconChevronDown, IconRocket, IconPlus, IconBuilding } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ProfileMenu } from './ProfileMenu';
import { apiClient, Project, Organization } from '../api/client';

interface CreateProjectForm {
  name: string;
  description: string;
  project: string;
}

export function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization: urlOrg, project: urlProject } = useParams();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (organizations.length > 0 && urlOrg) {
      const org = organizations.find(o => o.name === urlOrg);
      if (org) {
        setCurrentOrganization(org);
      }
    }
  }, [organizations, urlOrg]);

  useEffect(() => {
    if (currentOrganization) {
      loadProjects();
      // Update URL if it doesn't match current organization
      if (!location.pathname.includes(`/org/${currentOrganization.name}`)) {
        navigate(`/org/${currentOrganization.name}`);
      }
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (projects.length > 0 && urlProject) {
      const project = projects.find(p => p.name === urlProject);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projects, urlProject]);

  useEffect(() => {
    if (currentProject && currentOrganization) {
      const expectedPath = `/org/${currentOrganization.name}/project/${currentProject.name}`;
      if (!location.pathname.startsWith(expectedPath)) {
        navigate(expectedPath);
      }
    }
  }, [currentProject, currentOrganization]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.listOrganizations();
      setOrganizations(data || []);
      
      // Only set default organization if no organization in URL
      if (data && data.length > 0 && !urlOrg) {
        setCurrentOrganization(data[0]);
      }
    } catch (error) {
      const message = 'Failed to load organizations';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSelect = (org: Organization) => {
    setCurrentOrganization(org);
    setCurrentProject(null);
    navigate(`/org/${org.name}`);
  };

  const loadProjects = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.listProjects(currentOrganization.name);
      setProjects(data || []);
    } catch (error) {
      const message = 'Failed to load projects';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
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

    try {
      setCreating(true);

      // Create the project under the current organization
      await apiClient.createProject(currentOrganization.name, values.project, {
        name: values.name,
        description: values.description,
        metadata: {},
      });

      notifications.show({
        title: 'Success',
        message: 'Project created successfully',
        color: 'green',
      });

      // Reset form and close modal
      form.reset();
      setCreateModalOpen(false);

      // Navigate to the new project
      navigate(`/org/${currentOrganization.name}/project/${values.project}`);

      // Reload projects list
      await loadProjects();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    if (!currentOrganization) return;
    
    setCurrentProject(project);
    navigate(`/org/${currentOrganization.name}/project/${project.name}`);
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
              {loading ? (
                <Menu.Item disabled>
                  <Group justify="center">
                    <Loader size="sm" />
                  </Group>
                </Menu.Item>
              ) : error ? (
                <Menu.Item disabled color="red">
                  <Text size="sm" c="red">Failed to load organizations</Text>
                </Menu.Item>
              ) : organizations.length === 0 ? (
                <Menu.Item disabled>
                  <Text size="sm" c="dimmed">No organizations found</Text>
                </Menu.Item>
              ) : (
                organizations.map((org) => (
                  <Menu.Item
                    key={org.name}
                    onClick={() => handleOrganizationSelect(org)}
                  >
                    <Text size="sm">{org.name}</Text>
                    <Text size="xs" c="dimmed">{org.description}</Text>
                  </Menu.Item>
                ))
              )}
              <Menu.Divider />
              <Menu.Item
                onClick={() => navigate('/org/create')}
                leftSection={<IconPlus style={{ width: rem(16), height: rem(16) }} />}
              >
                Create Organization
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {currentOrganization && (
            <Menu position="bottom-start" shadow="md" width={220}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={3}>
                    <Text size="sm" fw={500}>
                      {currentProject?.name || 'Select Project'}
                    </Text>
                    <IconChevronDown style={{ width: rem(16), height: rem(16) }} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Projects</Menu.Label>
                {loading ? (
                  <Menu.Item disabled>
                    <Group justify="center">
                      <Loader size="sm" />
                    </Group>
                  </Menu.Item>
                ) : error ? (
                  <Menu.Item disabled color="red">
                    <Text size="sm" c="red">Failed to load projects</Text>
                  </Menu.Item>
                ) : projects.length === 0 ? (
                  <Menu.Item disabled>
                    <Text size="sm" c="dimmed">No projects found</Text>
                  </Menu.Item>
                ) : (
                  projects.map((project) => (
                    <Menu.Item
                      key={project.name}
                      onClick={() => handleProjectSelect(project)}
                      color={currentProject?.name === project.name ? 'blue' : undefined}
                    >
                      <Text size="sm">{project.name}</Text>
                      <Text size="xs" c="dimmed">{project.description}</Text>
                    </Menu.Item>
                  ))
                )}
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconPlus style={{ width: rem(16), height: rem(16) }} />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create Project
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        <ProfileMenu />
      </Group>

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
            <Button type="submit" loading={creating}>
              Create Project
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
} 