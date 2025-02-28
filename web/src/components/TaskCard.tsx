import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Text, 
  Group,
  Progress,
  Badge,
  ActionIcon,
  Tooltip,
  Stack,
  Divider,
  Collapse,
  Code,
  ScrollArea,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@skystore/core_types';
import { 
  IconPlayerPlay, 
  IconPlayerPause,
  IconTrash,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconStack,
  IconRotate,
} from '@tabler/icons-react';
import { usePauseTask, useResumeTask } from '../hooks/useTaskHooks';

const STATUS_CODES = {
  QUEUED: 10,
  RUNNING: 20,
  FAILED: 30,
  COMPLETED: 40,
  CANCELED: 50
} as const;

interface TaskStatus {
  code: typeof STATUS_CODES[keyof typeof STATUS_CODES];
}

interface ExtendedTask extends Omit<Task, 'status'> {
  status: TaskStatus;
}

function getStatusColor(status: TaskStatus) {
  switch (status.code) {
    case STATUS_CODES.QUEUED:
      return 'yellow';
    case STATUS_CODES.RUNNING:
      return 'blue';
    case STATUS_CODES.FAILED:
      return 'red';
    case STATUS_CODES.COMPLETED:
      return 'green';
    case STATUS_CODES.CANCELED:
      return 'gray';
    default:
      return 'gray';
  }
}

function getStatusText(status: TaskStatus) {
  switch (status.code) {
    case STATUS_CODES.QUEUED:
      return 'Queued';
    case STATUS_CODES.RUNNING:
      return 'Running';
    case STATUS_CODES.FAILED:
      return 'Failed';
    case STATUS_CODES.COMPLETED:
      return 'Completed';
    case STATUS_CODES.CANCELED:
      return 'Canceled';
    default:
      return 'Unknown';
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

export function TaskCard({ task }: { task: ExtendedTask }) {
  const [opened, { toggle }] = useDisclosure(false);
  const { organization, project, mission } = useParams();
  const queryClient = useQueryClient();

  const { data: taskStatus } = useQuery({
    queryKey: ['task-status', task.id],
    queryFn: async () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      const response = await fetch(`/api/org/${organization}/project/${project}/missions/${mission}/tasks/${task.id}/status`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return (await response.json()) as TaskStatus;
    },
    enabled: Boolean(organization && project && mission && task.status.code === STATUS_CODES.RUNNING),
    refetchInterval: task.status.code === STATUS_CODES.RUNNING ? 5000 : false,
  });

  const { data: consoleOutput, refetch: refetchLogs } = useQuery({
    queryKey: ['task-output', task.id],
    queryFn: async () => {
      if (!organization || !project || !mission) throw new Error('Missing parameters');
      const response = await fetch(`/api/org/${organization}/project/${project}/missions/${mission}/tasks/${task.id}/output`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data[0] ? (JSON.parse(data[0]) as string[]) : [];
    },
    enabled: Boolean(organization && project && mission),
    refetchInterval: false,
  });

  const { mutate: pauseTaskMutation } = usePauseTask();
  const { mutate: resumeTaskMutation } = useResumeTask();

  const currentTask = taskStatus || task;
  const isProcessing = currentTask.status.code === STATUS_CODES.RUNNING;
  const isPaused = currentTask.status.code === STATUS_CODES.QUEUED;
  const isCompleted = currentTask.status.code === STATUS_CODES.COMPLETED;

  return (
    <Card withBorder shadow="sm" padding="md" radius="md" style={{ width: '100%', maxWidth: '100%' }}>
      <Stack gap="xs">
        <Group justify="space-between" mb="xs">
          <Group>
            <Text fw={500} size="lg" truncate style={{ maxWidth: 200 }}>{currentTask.name}</Text>
            <Badge 
              variant="light" 
              color={getStatusColor(currentTask.status)}
              leftSection={isProcessing ? <IconRotate size={12} className="rotating" /> : null}
            >
              {getStatusText(currentTask.status)}
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

            {/* Console Output Section */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Console Output</Text>
                <Group gap="xs">
                  <ActionIcon 
                    variant="subtle" 
                    size="sm"
                    onClick={() => refetchLogs()}
                  >
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <ScrollArea h={100} type="auto" offsetScrollbars>
                <Box w="100%" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {consoleOutput && consoleOutput.length > 0 ? (
                      consoleOutput.map((line: string, index: number) => (
                        <Text key={index} size="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {line}
                        </Text>
                      ))
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic">No output available.</Text>
                    )}
                  </Code>
                </Box>
              </ScrollArea>
            </Stack>
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
                  onClick={() => resumeTaskMutation({ organization, project, mission, taskId: task.id })}
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
                  onClick={() => pauseTaskMutation({ organization, project, mission, taskId: task.id })}
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