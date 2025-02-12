import React, { useEffect, useState } from 'react';
import { Container, Title, Text, Button, Group, Stack, Card, FileButton, Progress, Select, Loader, Center } from '@mantine/core';
import { IconUpload, IconPhoto } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, Asset, Mission } from '../api/client';
import { notifications } from '@mantine/notifications';
import { AssetGrid } from '../components/AssetGrid';

export function MissionAssets() {
  const navigate = useNavigate();
  const { organization, project } = useParams();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (organization && project) {
      loadMissions();
    }
  }, [organization, project]);

  useEffect(() => {
    if (organization && project && selectedMission) {
      loadAssets();
    }
  }, [organization, project, selectedMission]);

  const loadMissions = async () => {
    if (!organization || !project) return;

    try {
      const data = await apiClient.listMissions(organization, project);
      setMissions(data || []);
      if (data && data.length > 0) {
        setSelectedMission(data[0].mission);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load missions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    if (!organization || !project || !selectedMission) return;

    try {
      const data = await apiClient.getMissionAssets(organization, project, selectedMission);
      setAssets(data || []);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load assets',
        color: 'red',
      });
    }
  };

  const handleFileUpload = async (files: File[] | null) => {
    if (!files || !organization || !project || !selectedMission) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await apiClient.uploadAsset(organization, project, selectedMission, file);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      notifications.show({
        title: 'Success',
        message: `${files.length} asset${files.length === 1 ? '' : 's'} uploaded successfully`,
        color: 'green',
      });

      await loadAssets();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to upload assets',
        color: 'red',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getThumbnailUrl = (asset: Asset) => {
    if (!organization || !project || !selectedMission) return '';
    return apiClient.getThumbnailUrl(organization, project, selectedMission, asset.id);
  };

  if (loading) {
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
          <Stack gap={0}>
            <Title order={2}>Mission Assets</Title>
            <Text c="dimmed">Upload and manage observation data and images</Text>
          </Stack>
          <Group>
            <Select
              label="Mission"
              placeholder="Select a mission"
              data={missions.map(m => ({ value: m.mission, label: m.name }))}
              value={selectedMission}
              onChange={setSelectedMission}
              style={{ minWidth: 200 }}
            />
            <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconUpload size={16} />}
                  loading={uploading}
                  disabled={!selectedMission}
                >
                  Upload Assets
                </Button>
              )}
            </FileButton>
          </Group>
        </Group>

        {uploading && (
          <Group align="center" gap="xs">
            <Progress
              value={uploadProgress}
              size="xl"
              radius="xl"
              style={{ flex: 1 }}
            />
            <Text size="sm" w={50} ta="right">{Math.round(uploadProgress)}%</Text>
          </Group>
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
                    loading={uploading}
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
            getThumbnailUrl={getThumbnailUrl}
          />
        )}
      </Stack>
    </Container>
  );
} 