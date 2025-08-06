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
  Paper,
  Center,
  Modal,
  Button,
  TextInput,
  SegmentedControl,
  Menu,
  Pagination,
  ScrollArea
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
  IconPhoto,
  IconSearch,
  IconFilter,
  IconLayoutGrid,
  IconLayoutList,
  IconSortAscending,
  IconSortDescending,
  IconChevronRight,
  IconAdjustments
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';

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
  flight_uuid?: string | null;
  flight?: {
    uuid: string;
    name: string;
    description: string | null;
  } | null;
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

interface FilterState {
  search: string;
  type: string;
  flight: string;
  sortBy: 'name' | 'date' | 'size';
  sortDirection: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 12;

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
  
  // New state for enhanced features
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    flight: 'all',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  // Compute unique file types and flights from assets
  const fileTypes = useMemo(() => {
    const types = new Set(assets.map(asset => asset.file_type.split('/')[1] || asset.extension));
    return ['all', ...Array.from(types)];
  }, [assets]);

  const flights = useMemo(() => {
    const uniqueFlights = new Set(assets
      .filter(asset => asset.flight)
      .map(asset => asset.flight!.uuid));
    return ['all', 'none', ...Array.from(uniqueFlights)];
  }, [assets]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || 
          (asset.file_type.split('/')[1] || asset.extension) === filters.type;
        const matchesFlight = filters.flight === 'all' || 
          (filters.flight === 'none' && !asset.flight) ||
          asset.flight?.uuid === filters.flight;
        return matchesSearch && matchesType && matchesFlight;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
            break;
          case 'size':
            comparison = b.size_bytes - a.size_bytes;
            break;
        }
        return filters.sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [assets, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle preview
  const handlePreview = (asset: Asset) => {
    // If there's an external view handler, use that
    if (onView) {
      onView(asset);
      return;
    }
    
    // Otherwise use the internal preview
    const isImage = asset.file_type.includes('image') || 
      ['jpg', 'jpeg', 'png', 'gif'].includes(asset.extension.toLowerCase());
    
    if (isImage && asset.thumbnail_url) {
      setPreviewAsset(asset);
    } else if (asset.download_url) {
      window.open(asset.download_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Render asset in grid view
  const renderAssetCard = (asset: Asset) => (
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
        <Box 
          pos="relative" 
          style={{ cursor: 'pointer' }}
          onClick={() => handlePreview(asset)}
        >
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
          <Tooltip label="View Asset">
            <ActionIcon 
              variant="subtle" 
              size="md" 
              color="blue"
              onClick={() => handlePreview(asset)}
              radius="xl"
            >
              <IconEye size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
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
  );

  // Render asset in list view
  const renderAssetList = (asset: Asset) => (
    <Card key={asset.uuid} withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <Box 
            style={{ cursor: 'pointer' }}
            onClick={() => handlePreview(asset)}
          >
            {asset.thumbnail_url ? (
              <Image
                src={asset.thumbnail_url}
                width={60}
                height={60}
                radius="md"
                alt={asset.name}
                fit="cover"
                fallbackSrc="https://placehold.co/60x60?text=No+Preview"
              />
            ) : (
              <Center 
                w={60} 
                h={60} 
                bg="gray.0" 
                style={{ borderRadius: 8 }}
              >
                {getAssetIcon(asset.contentType || asset.file_type)}
              </Center>
            )}
          </Box>
          <Stack gap={5} style={{ flex: 1 }}>
            <Text fw={600} size="sm" lineClamp={1} title={asset.name}>
              {asset.name}
            </Text>
            <Group gap="xs">
              <Badge 
                variant="light" 
                size="sm"
                color={getAssetColor(asset.contentType || asset.file_type)}
              >
                {(asset.contentType || asset.file_type).split('/')[1] || asset.extension}
              </Badge>
              <Text size="xs" c="dimmed">
                {formatFileSize(asset.size_bytes)}
              </Text>
              <Text size="xs" c="dimmed">•</Text>
              <Text size="xs" c="dimmed">
                {formatDate(asset.uploaded_at)}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group gap="xs">
          <Tooltip label="View Asset">
            <ActionIcon 
              variant="subtle" 
              size="md" 
              color="blue"
              onClick={() => handlePreview(asset)}
              radius="xl"
            >
              <IconEye size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
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
      </Group>
    </Card>
  );

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Card withBorder shadow="sm" padding="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="sm">
              <TextInput
                placeholder="Search assets..."
                leftSection={<IconSearch size={16} />}
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1); // Reset page when filter changes
                }}
              />
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconFilter size={16} />}>
                    Filter Type
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>File Type</Menu.Label>
                  {fileTypes.map(type => (
                    <Menu.Item
                      key={type}
                      onClick={() => {
                        setFilters({ ...filters, type });
                        setCurrentPage(1); // Reset page when filter changes
                      }}
                      rightSection={filters.type === type && <IconChevronRight size={14} />}
                    >
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconMap size={16} />}>
                    Filter Flight
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Flight</Menu.Label>
                  {flights.map(flightId => {
                    const flight = assets.find(a => a.flight?.uuid === flightId)?.flight;
                    return (
                      <Menu.Item
                        key={flightId}
                        onClick={() => {
                          setFilters({ ...filters, flight: flightId });
                          setCurrentPage(1); // Reset page when filter changes
                        }}
                        rightSection={filters.flight === flightId && <IconChevronRight size={14} />}
                      >
                        {
                          flightId === 'all' ? 'All Flights' :
                          flightId === 'none' ? 'No Flight' :
                          flight?.name || 'Unknown Flight'
                        }
                      </Menu.Item>
                    );
                  })}
                </Menu.Dropdown>
              </Menu>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconAdjustments size={16} />}>
                    Sort
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Sort By</Menu.Label>
                  <Menu.Item
                    onClick={() => setFilters({ ...filters, sortBy: 'name' })}
                    rightSection={filters.sortBy === 'name' && <IconChevronRight size={14} />}
                  >
                    Name
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setFilters({ ...filters, sortBy: 'date' })}
                    rightSection={filters.sortBy === 'date' && <IconChevronRight size={14} />}
                  >
                    Date
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setFilters({ ...filters, sortBy: 'size' })}
                    rightSection={filters.sortBy === 'size' && <IconChevronRight size={14} />}
                  >
                    Size
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Label>Direction</Menu.Label>
                  <Menu.Item
                    onClick={() => setFilters({ ...filters, sortDirection: 'asc' })}
                    rightSection={filters.sortDirection === 'asc' && <IconChevronRight size={14} />}
                    leftSection={<IconSortAscending size={14} />}
                  >
                    Ascending
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setFilters({ ...filters, sortDirection: 'desc' })}
                    rightSection={filters.sortDirection === 'desc' && <IconChevronRight size={14} />}
                    leftSection={<IconSortDescending size={14} />}
                  >
                    Descending
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'list')}
              data={[
                {
                  value: 'grid',
                  label: (
                    <Center>
                      <IconLayoutGrid size={16} />
                      <Box ml={10}>Grid</Box>
                    </Center>
                  ),
                },
                {
                  value: 'list',
                  label: (
                    <Center>
                      <IconLayoutList size={16} />
                      <Box ml={10}>List</Box>
                    </Center>
                  ),
                },
              ]}
            />
          </Group>
        </Stack>
      </Card>

      {/* Assets display (grid or list) */}
      <ScrollArea h="calc(100vh - 300px)" type="auto">
        {viewMode === 'grid' ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {paginatedAssets.map(renderAssetCard)}
          </SimpleGrid>
        ) : (
          <Stack gap="md">
            {paginatedAssets.map(renderAssetList)}
          </Stack>
        )}
        
        {/* Empty state */}
        {paginatedAssets.length === 0 && (
          <Center py="xl">
            <Stack align="center">
              <IconPhoto size={48} opacity={0.3} />
              <Text size="lg" c="dimmed">
                {assets.length === 0 
                  ? "No assets found" 
                  : "No assets match your filters"}
              </Text>
              {assets.length > 0 && filters.search && (
                <Button 
                  variant="light" 
                  onClick={() => setFilters({ ...filters, search: '', type: 'all', flight: 'all' })}
                >
                  Clear Filters
                </Button>
              )}
            </Stack>
          </Center>
        )}
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="md"
          />
          <Text size="sm" c="dimmed">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} of {filteredAssets.length} assets
          </Text>
        </Group>
      )}

      {/* Preview Modal for images */}
      <Modal
        opened={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        size="xl"
        title={previewAsset?.name}
      >
        {previewAsset && (
          <Stack gap="md">
            <Image
              src={previewAsset.thumbnail_url || ''}
              alt={previewAsset.name}
              fit="contain"
              style={{ maxHeight: '70vh' }}
            />
            <Group justify="center" gap="md">
              {onDownload && (
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => onDownload(previewAsset)}
                >
                  Download
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    onDelete(previewAsset);
                    setPreviewAsset(null);
                  }}
                >
                  Delete
                </Button>
              )}
            </Group>
            <Group justify="space-between">
              <Text size="sm">Type: {previewAsset.file_type || previewAsset.extension}</Text>
              <Text size="sm">Size: {formatFileSize(previewAsset.size_bytes)}</Text>
              <Text size="sm">Uploaded: {formatDate(previewAsset.uploaded_at)}</Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
} 