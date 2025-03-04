import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, Card, FileButton, Progress, Loader, Center } from '@mantine/core';
import { IconUpload, IconPhoto, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AssetGrid } from '../components/AssetGrid';

import { useAssets, useCreateAsset } from '../hooks/useAssetHooks';

export function MissionAssets() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError
  } = useAssets();

  // Mutation hook
  const { mutateAsync: createAsset, isPending: isUploading } = useCreateAsset();

  // Debug log assets
  useEffect(() => {
    console.log('assets', assets);
  }, [assets]);

  const handleFileUpload = async (files: File[] | null) => {
    if (!files) return;

    try {
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Upload the file using the createAsset hook
        await createAsset({ 
          file,
          owner_uuid: 'default', // Replace with actual user ID
          uploader_uuid: 'default', // Replace with actual user ID
          mission_uuid: 'default' // Replace with actual mission ID
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>Mission Assets</Title>
            <Text c="dimmed" size="sm">Upload and manage observation data and images</Text>
          </Stack>
          <Group>
            <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconUpload size={16} />}
                  loading={isUploading}
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

        {assetsLoading ? (
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
            assets={assets.data}
            onView={(asset) => console.log('View asset', asset)}
            onDownload={(asset) => window.open(asset.download_url, '_blank')}
            onDelete={(asset) => console.log('Delete asset', asset)}
          />
        )}
      </Stack>
    </Container>
  );
}