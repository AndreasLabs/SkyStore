import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Badge,
  ActionIcon,
  Collapse,
  Divider,
  Progress,
  ScrollArea,
  Code,
  Tooltip,
  Modal,
  TextInput,
  Textarea,
  Select,
  SimpleGrid,
  Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useTasks, useCreateTask, useCancelTask } from '../hooks/useTaskHooks';
import { Task, CreateTaskParams } from '@skystore/core_types';
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
  IconClock,
  IconStack,
  IconDownload,
  Icon3dCubeSphere,
  IconFileReport,
  IconMountain,
  IconDots,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { TaskCard } from '../components/TaskCard';

function getStatusColor(status: Task['status']) {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'in_progress':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function Tasks() {
  const { organization, project, mission } = useParams();
  const { data: tasks = [], isLoading, refetch } = useTasks(organization, project, mission);
  const createTaskMutation = useCreateTask();
  const queryClient = useQueryClient();

  const [opened, { open, close }] = useDisclosure(false);
  const [newTask, setNewTask] = useState<Partial<CreateTaskParams>>({
    status: 'pending',
  });

  const handleCreateTask = () => {
    if (!organization || !project || !mission) {
      notifications.show({
        title: 'Error',
        message: 'Organization, project, and mission are required.',
        color: 'red',
      });
      return;
    }

    createTaskMutation.mutate({
      ...newTask,
      organization_key: organization,
      project_key: project,
      mission_key: mission,
    } as any, {
      onSuccess: () => {
        close();
        setNewTask({ status: 'pending' });
        notifications.show({
          title: 'Success',
          message: 'Task created successfully',
          color: 'green',
        });
      },
      onError: (error) => {
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to create task',
          color: 'red',
        });
      },
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
            onClick={() => refetch()}
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
        <Center h={200}>
          <Loader size="md" />
        </Center>
      ) : (
        <SimpleGrid cols={{base: 1, sm: 2, md: 3}} spacing="lg">
          {pendingTasks.map((task) => (
            <TaskCard key={task.uuid} task={{...task, status: {code: 10}}} />
          ))}
          {inProgressTasks.map((task) => (
            <TaskCard key={task.uuid} task={{...task, status: {code: 20}}}/>
          ))}
          {completedTasks.map((task) => (
            <TaskCard key={task.uuid} task={{...task, status: {code: 40}}} />
          ))}
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
              { value: 'failed', label: 'Failed' }
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