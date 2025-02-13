import React, { useState, useEffect } from 'react';
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
  Code,
  ScrollArea,
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
  IconClock,
  IconStack,
  IconDownload,
  Icon3dCubeSphere,
  IconFileReport,
  IconMountain,
  IconDots,
} from '@tabler/icons-react';

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

function TaskCard({ task }: { task: Task }) {
  const [opened, { toggle }] = useDisclosure(false);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [logsModalOpened, setLogsModalOpened] = useState(false);
  const { organization, project, mission } = useParams();
  const queryClient = useQueryClient();

  // Poll for task status updates
  const { data: taskStatus } = useQuery({
    queryKey: ['task-status', task.id],
    queryFn: async () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      const response = await apiClient.getTaskStatus(organization, project, mission, task.id);
      return response;
    },
    enabled: Boolean(organization && project && mission && task.status === 'in_progress'),
    refetchInterval: task.status === 'in_progress' ? 5000 : false,
  });
 
  // Get console output
  const { data: consoleOutput, refetch: refetchLogs } = useQuery({
    queryKey: ['task-output', task.id],
    queryFn: async () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      const response = await apiClient.getTaskOutput(organization, project, mission, task.id, 0);
      // Handle the response data which could be a string or array
      const outputText = JSON.parse(response[0]);
      return outputText;
    },
    enabled: Boolean(organization && project && mission),
    refetchInterval: false, // Disable auto-polling
  });

  // Mutations for pause/resume
  const pauseTaskMutation = useMutation({
    mutationFn: () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      return apiClient.pauseTask(organization, project, mission, task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status', task.id] });
      notifications.show({
        title: 'Success',
        message: 'Task paused successfully',
        color: 'yellow',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to pause task',
        color: 'red',
      });
    },
  });

  const resumeTaskMutation = useMutation({
    mutationFn: () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      return apiClient.resumeTask(organization, project, mission, task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status', task.id] });
      notifications.show({
        title: 'Success',
        message: 'Task resumed successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to resume task',
        color: 'red',
      });
    },
  });

  // Use the latest task data
  const currentTask = taskStatus || task;
  const isProcessing = currentTask.status === 'in_progress';
  const isPaused = currentTask.status === 'pending';
  const isCompleted = currentTask.status === 'completed';

  return (
    <Card withBorder shadow="sm" padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" mb="xs">
          <Group>
            <Text fw={500} size="lg" truncate>{currentTask.name}</Text>
            <Badge 
              variant="light" 
              color={getStatusColor(currentTask.status)}
              leftSection={currentTask.status === 'in_progress' ? <IconRotate size={12} className="rotating" /> : null}
            >
              {currentTask.status}
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
          {currentTask.description}
        </Text>

        {isProcessing && (
          <Stack gap="xs">
            <Progress 
              value={currentTask.progress} 
              size="sm" 
              color={currentTask.progress === 100 ? 'green' : 'blue'}
              striped 
              animated
            />
            <Text size="xs" c="dimmed" ta="right">{Math.round(currentTask.progress)}%</Text>
          </Stack>
        )}

        <Collapse in={opened}>
          <Stack gap="md" mt="md">
            <Divider />
            
            <Stack gap="xs">
              <Text size="sm" fw={500}>Task Details</Text>
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="sm" fw={500}>Created:</Text>
                <Text size="sm" c="dimmed">{new Date(currentTask.createdAt).toLocaleString()}</Text>
              </Group>
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="sm" fw={500}>Last Updated:</Text>
                <Text size="sm" c="dimmed">{new Date(currentTask.updatedAt).toLocaleString()}</Text>
              </Group>
              {currentTask.odmTaskId && (
                <>
                  <Group gap="xs">
                    <IconStack size={14} />
                    <Text size="sm" fw={500}>Images:</Text>
                    <Text size="sm" c="dimmed">{currentTask.imagesCount || 'N/A'}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={14} />
                    <Text size="sm" fw={500}>Processing Time:</Text>
                    <Text size="sm" c="dimmed">
                      {currentTask.processingTime ? formatDuration(currentTask.processingTime) : 'N/A'}
                    </Text>
                  </Group>
                </>
              )}
              {currentTask.error && (
                <Text size="sm" c="red">Error: {currentTask.error}</Text>
              )}
            </Stack>

            {/* Console Output Section - Simplified */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Console Output</Text>
                <Group gap="xs">
                  <Button 
                    variant="subtle" 
                    size="xs"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => refetchLogs()}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    leftSection={<IconChevronUp size={14} />}
                    onClick={() => setLogsModalOpened(true)}
                  >
                    Expand
                  </Button>
                </Group>
              </Group>
              <ScrollArea h={200} type="auto">
                <Code block>
                  {consoleOutput && consoleOutput.length > 0 ? (
                    consoleOutput.map((line, index) => (
                      <Text key={index} size="xs" style={{ whiteSpace: 'pre-wrap' }}>{line}</Text>
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" fs="italic">No output available.</Text>
                  )}
                </Code>
              </ScrollArea>
            </Stack>

            {isCompleted && currentTask.assets && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Results</Text>
                <Group>
                  <Tooltip label="Download All Results">
                    <Button
                      component="a"
                      href={currentTask.assets.all}
                      download
                      variant="light"
                      size="xs"
                      leftSection={<IconDownload size={14} />}
                      color="blue"
                    >
                      All Results
                    </Button>
                  </Tooltip>
                  {currentTask.assets.orthophoto && (
                    <Tooltip label="Download Orthophoto">
                      <Button
                        component="a"
                        href={currentTask.assets.orthophoto}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<IconMap size={14} />}
                        color="green"
                      >
                        Orthophoto
                      </Button>
                    </Tooltip>
                  )}
                  {currentTask.assets.dsm && (
                    <Tooltip label="Download DSM">
                      <Button
                        component="a"
                        href={currentTask.assets.dsm}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<IconMountain size={14} />}
                        color="orange"
                      >
                        DSM
                      </Button>
                    </Tooltip>
                  )}
                  {currentTask.assets.dtm && (
                    <Tooltip label="Download DTM">
                      <Button
                        component="a"
                        href={currentTask.assets.dtm}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<IconMountain size={14} />}
                        color="yellow"
                      >
                        DTM
                      </Button>
                    </Tooltip>
                  )}
                  {currentTask.assets.pointcloud && (
                    <Tooltip label="Download Point Cloud">
                      <Button
                        component="a"
                        href={currentTask.assets.pointcloud}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<IconDots size={14} />}
                        color="violet"
                      >
                        Point Cloud
                      </Button>
                    </Tooltip>
                  )}
                  {currentTask.assets.model3d && (
                    <Tooltip label="Download 3D Model">
                      <Button
                        component="a"
                        href={currentTask.assets.model3d}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<Icon3dCubeSphere size={14} />}
                        color="pink"
                      >
                        3D Model
                      </Button>
                    </Tooltip>
                  )}
                  {currentTask.assets.report && (
                    <Tooltip label="Download Report">
                      <Button
                        component="a"
                        href={currentTask.assets.report}
                        download
                        variant="light"
                        size="xs"
                        leftSection={<IconFileReport size={14} />}
                        color="gray"
                      >
                        Report
                      </Button>
                    </Tooltip>
                  )}
                </Group>
              </Stack>
            )}
          </Stack>
        </Collapse>

        <Divider />

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            ID: {currentTask.id.slice(0, 8)}
          </Text>

          <Group gap="xs">
            {isPaused && (
              <Tooltip label="Resume Processing">
                <ActionIcon 
                  variant="light" 
                  size="sm" 
                  color="green"
                  onClick={() => resumeTaskMutation.mutate()}
                  loading={resumeTaskMutation.isPending}
                >
                  <IconPlayerPlay size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {isProcessing && (
              <Tooltip label="Pause Processing">
                <ActionIcon 
                  variant="light" 
                  size="sm" 
                  color="yellow"
                  onClick={() => pauseTaskMutation.mutate()}
                  loading={pauseTaskMutation.isPending}
                >
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