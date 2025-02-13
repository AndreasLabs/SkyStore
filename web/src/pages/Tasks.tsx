import React from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Title, 
  Card, 
  Text, 
  Button, 
  Group,
  Modal,
  TextInput,
  Textarea,
  Select,
  Progress,
  Badge,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Stack,
  Divider,
  Box,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Task, CreateTaskPayload } from '../api/client';
import { 
  IconPlus, 
  IconPlayerPlay, 
  IconPlayerPause,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconX,
  IconClockHour4,
  IconRotate,
  IconPhoto,
  IconMap,
  IconChartBar,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

function getStatusColor(status: Task['status']) {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'in_progress':
      return 'blue';
    case 'completed':
      return 'green';
    default:
      return 'gray';
  }
}

function TaskCard({ task }: { task: Task }) {
  const [opened, { toggle }] = useDisclosure(false);
  const processingProgress = Math.random() * 100;
  const isProcessing = task.status === 'in_progress';

  return (
    <Card withBorder shadow="sm" padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" mb="xs">
          <Group>
            <Text fw={500} size="lg" truncate>{task.name}</Text>
            <Badge 
              variant="light" 
              color={getStatusColor(task.status)}
              leftSection={task.status === 'in_progress' ? <IconRotate size={12} className="rotating" /> : null}
            >
              {task.status}
            </Badge>
          </Group>
          <ActionIcon 
            variant="subtle" 
            onClick={toggle}
            aria-label="Toggle details"
          >
            {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={opened ? undefined : 2}>
          {task.description}
        </Text>

        {isProcessing && (
          <Stack gap="xs">
            <Progress 
              value={processingProgress} 
              size="sm" 
              color={processingProgress === 100 ? 'green' : 'blue'}
              striped 
              animated
            />
            <Text size="xs" c="dimmed" ta="right">{Math.round(processingProgress)}%</Text>
          </Stack>
        )}

        <Collapse in={opened}>
          <Stack gap="md" mt="md">
            <Divider />
            
            <Stack gap="xs">
              <Text size="sm" fw={500}>Task Details</Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>Created:</Text>
                <Text size="sm" c="dimmed">{new Date(task.createdAt).toLocaleString()}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" fw={500}>Last Updated:</Text>
                <Text size="sm" c="dimmed">{new Date(task.updatedAt).toLocaleString()}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" fw={500}>Mission ID:</Text>
                <Text size="sm" c="dimmed">{task.missionId}</Text>
              </Group>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" fw={500}>Actions</Text>
              <Group>
                <Tooltip label="View Images">
                  <Button 
                    variant="light" 
                    size="xs" 
                    leftSection={<IconPhoto size={14} />}
                    color="gray"
                  >
                    Images
                  </Button>
                </Tooltip>
                <Tooltip label="View Map">
                  <Button 
                    variant="light" 
                    size="xs" 
                    leftSection={<IconMap size={14} />}
                    color="gray"
                  >
                    Map
                  </Button>
                </Tooltip>
                <Tooltip label="View Analytics">
                  <Button 
                    variant="light" 
                    size="xs" 
                    leftSection={<IconChartBar size={14} />}
                    color="gray"
                  >
                    Analytics
                  </Button>
                </Tooltip>
              </Group>
            </Stack>
          </Stack>
        </Collapse>

        <Divider />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            ID: {task.id.slice(0, 8)}
          </Text>

          <Group gap="xs">
            {task.status === 'pending' && (
              <Tooltip label="Start Processing">
                <ActionIcon variant="light" size="sm" color="green">
                  <IconPlayerPlay size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {task.status === 'in_progress' && (
              <Tooltip label="Pause Processing">
                <ActionIcon variant="light" size="sm" color="yellow">
                  <IconPlayerPause size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Delete Task">
              <ActionIcon variant="light" size="sm" color="red">
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

function TaskColumn({ title, tasks, icon: Icon, color }: { 
  title: string; 
  tasks: Task[]; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <Group gap="xs">
          <Icon size={20} color={`var(--mantine-color-${color}-filled)`} />
          <Text fw={500}>{title}</Text>
          <Text size="sm" c="dimmed">({tasks.length})</Text>
        </Group>
        <Stack gap="md">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

export default function Tasks() {
  const { organization, project, mission } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Partial<CreateTaskPayload>>({});
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', organization, project, mission],
    queryFn: () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      return apiClient.listTasks(organization, project, mission);
    },
    enabled: Boolean(organization && project && mission)
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskPayload) => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      return apiClient.createTask(organization, project, mission, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization, project, mission] });
      notifications.show({
        title: 'Success',
        message: 'Task created successfully',
        color: 'green',
      });
      close();
      setNewTask({});
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create task',
        color: 'red',
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.name || !newTask.description) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all required fields',
        color: 'red',
      });
      return;
    }

    if (!mission) {
      notifications.show({
        title: 'Error',
        message: 'Mission ID is required',
        color: 'red',
      });
      return;
    }

    createTaskMutation.mutate({
      name: newTask.name,
      description: newTask.description,
      missionId: mission,
      status: newTask.status || 'pending',
    });
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Mission Tasks</Title>
          <Text c="dimmed">Manage and monitor processing tasks</Text>
        </Stack>
        <Group>
          <Button 
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
          >
            Refresh
          </Button>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={open}
          >
            Create New Task
          </Button>
        </Group>
      </Group>

      {isLoading ? (
        <Text>Loading tasks...</Text>
      ) : (
        <SimpleGrid cols={3}>
          <TaskColumn 
            title="Pending" 
            tasks={pendingTasks} 
            icon={IconClockHour4}
            color="yellow"
          />
          <TaskColumn 
            title="Processing" 
            tasks={inProgressTasks} 
            icon={IconRotate}
            color="blue"
          />
          <TaskColumn 
            title="Completed" 
            tasks={completedTasks} 
            icon={IconCheck}
            color="green"
          />
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title="Create New Task">
        <Stack gap="md">
          <TextInput
            label="Task Name"
            placeholder="Enter task name"
            value={newTask.name || ''}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter task description"
            value={newTask.description || ''}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            required
            minRows={3}
          />
          <Select
            label="Status"
            placeholder="Select status"
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={newTask.status}
            onChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={close}>Cancel</Button>
            <Button onClick={handleCreateTask} loading={createTaskMutation.isPending}>
              Create Task
            </Button>
          </Group>
        </Stack>
      </Modal>

      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .rotating {
            animation: rotate 2s linear infinite;
          }
        `}
      </style>
    </Container>
  );
} 