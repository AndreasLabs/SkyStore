import React from 'react';
import { Container, Title, Text, Button, Group, Stack, Card, FileButton, Progress, Select, Loader, Center } from '@mantine/core';
import { IconUpload, IconPhoto, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AssetGrid } from '../components/AssetGrid';
import { useMissions, useAssets, useUploadAsset, useGetThumbnailUrl } from '../api/hooks';

export function MissionAssets() {
  const navigate = useNavigate();
  const { organization, project } = useParams();
  const [selectedMission, setSelectedMission] = React.useState<string | null>(null);

  // Query hooks
  const { 
    data: missions = [], 
    isLoading: missionsLoading,
    error: missionsError 
  } = useMissions(organization || '', project || '');

  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError
  } = useAssets(
    organization || '', 
    project || '', 
    selectedMission || ''
  );

  // Mutation hook
  const { mutateAsync: uploadAsset, isPending: isUploading } = useUploadAsset();
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Initialize selected mission
  React.useEffect(() => {
    if (missions.length > 0 && !selectedMission) {
      setSelectedMission(missions[0].mission);
    }
  }, [missions]);

  // Get thumbnail URL helper
  const getThumbnailUrl = useGetThumbnailUrl();

  const handleFileUpload = async (files: File[] | null) => {
    if (!files || !organization || !project || !selectedMission) return;

    try {
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadAsset({ 
          organization, 
          project, 
          mission: selectedMission, 
          file 
        });
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      notifications.show({
        title: 'Success',
        message: `${files.length} asset${files.length === 1 ? '' : 's'} uploaded successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to upload assets',
        color: 'red',
      });
    } finally {
      setUploadProgress(0);
    }
  };

  // Error states
  if (missionsError) {
    return (
      <Container size="lg" py="xl">
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconInfoCircle size={48} opacity={0.5} />
            <Text c="red" size="lg" fw={500}>Failed to load missions</Text>
            <Text c="dimmed" ta="center">Unable to retrieve mission data. Please try again.</Text>
            <Button onClick={() => window.location.reload()} variant="light">Retry</Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  // Loading state
  if (missionsLoading) {
    return (
      <Center h="100%">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Mission Assets</Title>
            <Text c="dimmed" size="sm">Upload and manage observation data and images</Text>
          </Stack>
          <Group>
            <Select
              placeholder="Select a mission"
              data={missions.map(m => ({ value: m.mission, label: m.name }))}
              value={selectedMission}
              onChange={setSelectedMission}
              style={{ minWidth: 250 }}
            />
            <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconUpload size={16} />}
                  loading={isUploading}
                  disabled={!selectedMission}
                  variant="filled"
                >
                  Upload Assets
                </Button>
              )}
            </FileButton>
          </Group>
        </Group>

        {isUploading && (
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Uploading Assets...</Text>
              <Group align="center" gap="xs">
                <Progress
                  value={uploadProgress}
                  size="xl"
                  radius="xl"
                  style={{ flex: 1 }}
                />
                <Text size="sm" w={50} ta="right">{Math.round(uploadProgress)}%</Text>
              </Group>
            </Stack>
          </Card>
        )}

        {!selectedMission ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconPhoto size={48} opacity={0.5} />
              <Text ta="center" size="lg" fw={500}>Select a Mission</Text>
              <Text ta="center" c="dimmed">
                Choose a mission to view and manage its assets
              </Text>
            </Stack>
          </Card>
        ) : assetsLoading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : assetsError ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconInfoCircle size={48} opacity={0.5} />
              <Text c="red" size="lg" fw={500}>Failed to load assets</Text>
              <Text c="dimmed" ta="center">Unable to retrieve asset data. Please try again.</Text>
              <Button onClick={() => window.location.reload()} variant="light">
                Retry
              </Button>
            </Stack>
          </Card>
        ) : assets.length === 0 ? (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <IconPhoto size={48} opacity={0.5} />
              <Text ta="center" size="lg" fw={500}>No Assets Yet</Text>
              <Text ta="center" c="dimmed">
                Upload your first observation data or image to get started
              </Text>
              <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    leftSection={<IconUpload size={16} />}
                    loading={isUploading}
                  >
                    Upload Assets
                  </Button>
                )}
              </FileButton>
            </Stack>
          </Card>
        ) : (
          <AssetGrid
            assets={assets}
            organization={organization || ''}
            project={project || ''}
            mission={selectedMission}
            getThumbnailUrl={(asset) => getThumbnailUrl(asset, organization || '', project || '', selectedMission)}
          />
        )}
      </Stack>
    </Container>
  );
} 