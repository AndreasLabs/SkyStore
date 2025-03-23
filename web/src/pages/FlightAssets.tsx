import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Card, 
  FileButton, 
  Progress, 
  Loader, 
  Center,
  Box,
  Paper,
  rem,
  Transition,
  ThemeIcon
} from '@mantine/core';
import { 
  IconUpload, 
  IconPhoto, 
  IconInfoCircle,
  IconCheck,
  IconArrowRight
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AssetGrid } from '../components/AssetGrid';

import { useAssets, useCreateAsset } from '../hooks/useAssetHooks';
import { useAuth } from '../contexts/AuthContext';

export function FlightAssets() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const {
    data: assets = [],
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useAssets();

  // Mutation hook
  const { mutateAsync: createAsset, isPending: isUploading } = useCreateAsset();

  // Debug log assets
  useEffect(() => {
    console.log('assets', assets);
  }, [assets]);

  const handleFileUpload = async (files: File[] | null) => {
    if (!files || !user) return;

    try {
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Upload the file using the createAsset hook
        await createAsset({ 
          file,
          flight_uuid: 'default' // Replace with actual flight ID
        });
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      // Refresh asset list
      refetchAssets();
      
      notifications.show({
        title: 'Success',
        message: `${files.length} asset${files.length === 1 ? '' : 's'} uploaded successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
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
        {/* Header */}
        <Paper 
          p="md" 
          radius="md" 
          shadow="xs"
          style={{ 
            background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-indigo-5))', 
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 70%)',
              zIndex: 0
            }} 
          />
          
          <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Title order={2} c="white">Flight Assets</Title>
                <Text c="white" opacity={0.9} size="sm">Upload and manage observation data and images</Text>
              </Stack>
              <Group>
                <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      loading={isUploading}
                      variant="white"
                      radius="md"
                    >
                      Upload Assets
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Upload progress */}
        <Transition mounted={isUploading} transition="slide-down" duration={400} timingFunction="ease">
          {(styles) => (
            <Card withBorder shadow="sm" p="md" radius="md" style={styles}>
              <Stack gap="xs">
                <Group position="apart">
                  <Text fw={600} size="sm">Uploading Assets...</Text>
                  <Text fw={600} size="sm" c="blue">{Math.round(uploadProgress)}%</Text>
                </Group>
                <Progress 
                  value={uploadProgress} 
                  size="md" 
                  radius="xl" 
                  color="blue"
                  striped
                  animated={uploadProgress < 100}
                />
              </Stack>
            </Card>
          )}
        </Transition>

        {/* Loading, error, or empty states */}
        {assetsLoading ? (
          <Center p="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" color="blue" />
              <Text c="dimmed" size="sm">Loading assets...</Text>
            </Stack>
          </Center>
        ) : assetsError ? (
          <Card withBorder p="xl" radius="md" shadow="sm">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius={100} color="red" variant="light">
                <IconInfoCircle size={30} stroke={1.5} />
              </ThemeIcon>
              <Title order={3} ta="center">Failed to load assets</Title>
              <Text c="dimmed" ta="center" maw={500} mx="auto">
                We couldn't retrieve your asset data. Please try again or contact support if the problem persists.
              </Text>
              <Button 
                onClick={() => refetchAssets()} 
                variant="light" 
                color="blue"
                leftSection={<IconArrowRight size={16} />}
                radius="md"
              >
                Retry
              </Button>
            </Stack>
          </Card>
        ) : assets.length === 0 ? (
          <Card withBorder p={40} radius="md" shadow="sm">
            <Stack align="center" gap="lg">
              <ThemeIcon size={80} radius={100} color="blue" variant="light">
                <IconPhoto size={40} stroke={1.5} />
              </ThemeIcon>
              <Stack gap="sm" align="center">
                <Title order={2} ta="center">No Assets Yet</Title>
                <Text ta="center" c="dimmed" maw={450} mx="auto">
                  Upload your first observation data or image to get started with your flight
                </Text>
              </Stack>
              <FileButton onChange={handleFileUpload} accept="image/*,application/fits" multiple>
                {(props) => (
                  <Button
                    {...props}
                    variant="filled"
                    color="blue"
                    size="md"
                    radius="md"
                    leftSection={<IconUpload size={18} />}
                    loading={isUploading}
                  >
                    Upload Your First Asset
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