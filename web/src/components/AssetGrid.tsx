import { 
  SimpleGrid, 
  Card, 
  Image, 
  Text, 
  Group, 
  Stack,
  ActionIcon,
  Tooltip,
  Badge,
  Divider,
  Box,
  rem,
  Paper
} from '@mantine/core';
import { 
  IconDownload, 
  IconTrash, 
  IconEye,
  IconMap,
  IconMountain,
  IconDots,
  Icon3dCubeSphere,
  IconFileReport,
  IconUser,
  IconCloudUpload,
  IconCalendar,
  IconPhoto
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

// Define Asset interface based on the Prisma schema
interface Asset {
  uuid: string;
  name: string;
  stored_path: string;
  file_type: string;
  extension: string;
  size_bytes: number;
  uploaded_at: Date;
  download_url: string;
  thumbnail_url?: string | null;
  mission_uuid?: string | null;
  owner_uuid: string;
  uploader_uuid: string;
  access_uuids: string[];
  contentType?: string; // For backward compatibility
}

interface AssetGridProps {
  assets: Asset[];
  onView?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

function getAssetIcon(fileType: string) {
  const iconSize = 24;
  
  switch (fileType.split('/')[1] || fileType) {
    case 'orthophoto':
      return <IconMap size={iconSize} stroke={1.5} />;
    case 'dsm':
    case 'dtm':
      return <IconMountain size={iconSize} stroke={1.5} />;
    case 'pointcloud':
      return <IconDots size={iconSize} stroke={1.5} />;
    case 'model3d':
      return <Icon3dCubeSphere size={iconSize} stroke={1.5} />;
    case 'report':
    case 'pdf':
      return <IconFileReport size={iconSize} stroke={1.5} />;
    case 'jpeg':
    case 'jpg':
    case 'png':
      return <IconPhoto size={iconSize} stroke={1.5} />;
    default:
      return <IconPhoto size={iconSize} stroke={1.5} />;
  }
}

function getAssetColor(fileType: string) {
  switch (fileType.split('/')[1] || fileType) {
    case 'orthophoto':
      return 'teal';
    case 'dsm':
      return 'orange';
    case 'dtm':
      return 'yellow';
    case 'pointcloud':
      return 'violet';
    case 'model3d':
      return 'pink';
    case 'report':
    case 'pdf':
      return 'gray';
    case 'jpeg':
    case 'jpg':
    case 'png':
      return 'blue';
    default:
      return 'blue';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function AssetGrid({ assets, onView, onDownload, onDelete }: AssetGridProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
      {assets.map((asset) => (
        <Card 
          key={asset.uuid} 
          withBorder 
          shadow="sm" 
          padding="lg" 
          radius="md"
          style={{ 
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Card.Section>
            <Box pos="relative">
              {asset.thumbnail_url ? (
                <Image
                  src={asset.thumbnail_url}
                  height={180}
                  alt={asset.name}
                  fit="cover"
                  fallbackSrc="https://placehold.co/600x400?text=No+Preview"
                />
              ) : (
                <Paper 
                  h={180} 
                  bg="gray.0" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '8px 8px 0 0',
                    overflow: 'hidden'
                  }}
                >
                  <Box style={{ opacity: 0.7 }}>
                    {getAssetIcon(asset.contentType || asset.file_type)}
                  </Box>
                </Paper>
              )}
              
              <Badge 
                variant="filled" 
                size="md"
                color={getAssetColor(asset.contentType || asset.file_type)}
                pos="absolute"
                top={8}
                right={8}
                style={{ 
                  backdropFilter: 'blur(6px)',
                  background: `rgba(var(--mantine-color-${getAssetColor(asset.contentType || asset.file_type)}-filled-rgb), 0.85)`,
                }}
              >
                {(asset.contentType || asset.file_type).split('/')[1] || asset.extension}
              </Badge>
            </Box>
          </Card.Section>

          <Stack gap="xs" mt="md">
            <Text fw={600} size="md" lineClamp={1} title={asset.name}>
              {asset.name}
            </Text>
            
            <Group gap="xs">
              <Badge variant="light" color="gray">
                {formatFileSize(asset.size_bytes)}
              </Badge>
              <Group gap={4}>
                <IconCalendar size={12} stroke={1.5} />
                <Text size="xs" c="dimmed">
                  {formatDate(asset.uploaded_at)}
                </Text>
              </Group>
            </Group>
            
            {/* Show owner and uploader information when authenticated */}
            {isAuthenticated && (
              <Box mt={5}>
                <Group gap="xs">
                  <IconUser size={14} stroke={1.5} />
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {asset.owner_uuid.substring(0, 8)}...
                  </Text>
                </Group>
              </Box>
            )}

            <Divider my={8} />

            <Group justify="flex-end" gap="xs">
              {onView && (
                <Tooltip label="View Asset">
                  <ActionIcon 
                    variant="subtle" 
                    size="md" 
                    color="blue"
                    onClick={() => onView(asset)}
                    radius="xl"
                  >
                    <IconEye size={18} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onDownload && (
                <Tooltip label="Download Asset">
                  <ActionIcon 
                    variant="subtle" 
                    size="md" 
                    color="teal"
                    onClick={() => onDownload(asset)}
                    radius="xl"
                  >
                    <IconDownload size={18} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip label="Delete Asset">
                  <ActionIcon 
                    variant="subtle" 
                    size="md" 
                    color="red"
                    onClick={() => onDelete(asset)}
                    radius="xl"
                  >
                    <IconTrash size={18} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
} 