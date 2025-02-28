import React, { useState, useMemo } from 'react';
import { 
  SimpleGrid, 
  Card, 
  Center, 
  Image, 
  Text, 
  Group, 
  Button, 
  Stack, 
  Modal, 
  Badge, 
  ActionIcon, 
  Tooltip, 
  TextInput,
  Select,
  Pagination,
  Menu,
  Checkbox,
  Box,
  SegmentedControl,
  Divider,
  ScrollArea,
} from '@mantine/core';
import { 
  IconFile, 
  IconDownload, 
  IconEye, 
  IconPhoto, 
  IconFileTypePdf, 
  IconFileTypeXls, 
  IconFileTypeDoc, 
  IconFileTypeZip, 
  IconFile3d,
  IconSearch,
  IconFilter,
  IconFolders,
  IconLayoutGrid,
  IconLayoutList,
  IconSortAscending,
  IconSortDescending,
  IconChevronRight,
} from '@tabler/icons-react';
import { Asset } from '@skystore/core_types';

interface AssetGridProps {
  assets: Asset[];
  organization: string;
  project: string;
  mission: string;
  getThumbnailUrl: (asset: Asset) => string;
}

interface FilterState {
  search: string;
  type: string;
  folder: string;
  sortBy: 'name' | 'date' | 'size';
  sortDirection: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 12;

export function AssetGrid({ assets, organization, project, mission, getThumbnailUrl }: AssetGridProps) {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    folder: 'all',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  // Compute unique file types and folders from assets
  const fileTypes = useMemo(() => {
    const types = new Set(assets.map(asset => asset.contentType.split('/')[1]));
    return ['all', ...Array.from(types)];
  }, [assets]);

  const folders = useMemo(() => {
    const dirs = new Set(assets.map(asset => {
      const parts = asset.originalName.split('/');
      return parts.length > 1 ? parts[0] : 'root';
    }));
    return ['all', ...Array.from(dirs)];
  }, [assets]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
        const matchesSearch = asset.originalName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || asset.contentType.split('/')[1] === filters.type;
        const matchesFolder = filters.folder === 'all' || asset.originalName.split('/')[0] === filters.folder;
        return matchesSearch && matchesType && matchesFolder;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = a.originalName.localeCompare(b.originalName);
            break;
          case 'date':
            comparison = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
            break;
          case 'size':
            comparison = b.size - a.size;
            break;
        }
        return filters.sortDirection === 'asc' ? -comparison : comparison;
      });
  }, [assets, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isImage = (asset: Asset) => {
    return asset.contentType.startsWith('image/');
  };

  const getFileIcon = (asset: Asset) => {
    const type = asset.contentType;
    if (type.startsWith('image/')) return IconPhoto;
    if (type.includes('pdf')) return IconFileTypePdf;
    if (type.includes('spreadsheet') || type.includes('excel')) return IconFileTypeXls;
    if (type.includes('document') || type.includes('word')) return IconFileTypeDoc;
    if (type.includes('zip') || type.includes('compressed')) return IconFileTypeZip;
    if (type.includes('fits')) return IconFile3d;
    return IconFile;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleView = (asset: Asset) => {
    if (!isImage(asset)) {
      window.open(asset.presignedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setPreviewAsset(asset);
  };

  const renderAssetCard = (asset: Asset) => {
    const FileIcon = getFileIcon(asset);
    return (
      <Card key={asset.uuid} withBorder padding="lg" radius="md">
        <Card.Section 
          style={{ cursor: 'pointer', position: 'relative' }} 
          onClick={() => handleView(asset)}
        >
          {isImage(asset) ? (
            <Image
              src={getThumbnailUrl(asset)}
              height={200}
              alt={asset.originalName}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <Center h={200} bg="gray.1">
              <FileIcon size={48} opacity={0.5} />
            </Center>
          )}
          <Badge 
            style={{ 
              position: 'absolute', 
              top: 10, 
              right: 10,
              textTransform: 'uppercase'
            }}
            variant="light"
          >
            {asset.contentType.split('/')[1]}
          </Badge>
        </Card.Section>

        <Stack gap="xs" mt="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2} style={{ flex: 1 }}>
              <Text fw={500} truncate="end" title={asset.originalName}>
                {asset.originalName.split('/').pop()}
              </Text>
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  {formatFileSize(asset.size)}
                </Text>
                <Text size="xs" c="dimmed">•</Text>
                <Text size="xs" c="dimmed">
                  {new Date(asset.uploadedAt).toLocaleDateString()}
                </Text>
              </Group>
            </Stack>
          </Group>

          <Group gap="xs">
            <Tooltip label={isImage(asset) ? 'Preview' : 'Open'}>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => handleView(asset)}
                aria-label={isImage(asset) ? 'Preview image' : 'Open file'}
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Download">
              <ActionIcon
                variant="light"
                size="lg"
                component="a"
                href={asset.directUrl}
                download={asset.originalName}
                aria-label="Download file"
              >
                <IconDownload size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </Card>
    );
  };

  const renderAssetList = (asset: Asset) => {
    const FileIcon = getFileIcon(asset);
    return (
      <Card key={asset.uuid} withBorder padding="sm" radius="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
            <Center w={40} h={40} bg="gray.1" style={{ borderRadius: 4 }}>
              <FileIcon size={24} opacity={0.5} />
            </Center>
            <Stack gap={2} style={{ flex: 1 }}>
              <Text fw={500} truncate="end" title={asset.originalName}>
                {asset.originalName.split('/').pop()}
              </Text>
              <Group gap="xs">
                <Badge variant="light" size="sm">
                  {asset.contentType.split('/')[1]}
                </Badge>
                <Text size="xs" c="dimmed">
                  {formatFileSize(asset.size)}
                </Text>
                <Text size="xs" c="dimmed">•</Text>
                <Text size="xs" c="dimmed">
                  {new Date(asset.uploadedAt).toLocaleDateString()}
                </Text>
              </Group>
            </Stack>
          </Group>

          <Group gap="xs">
            <Tooltip label={isImage(asset) ? 'Preview' : 'Open'}>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => handleView(asset)}
                aria-label={isImage(asset) ? 'Preview image' : 'Open file'}
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Download">
              <ActionIcon
                variant="light"
                size="lg"
                component="a"
                href={asset.directUrl}
                download={asset.originalName}
                aria-label="Download file"
              >
                <IconDownload size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>
    );
  };

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="sm">
              <TextInput
                placeholder="Search assets..."
                leftSection={<IconSearch size={16} />}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconFilter size={16} />}>
                    Filters
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>File Type</Menu.Label>
                  {fileTypes.map(type => (
                    <Menu.Item
                      key={type}
                      onClick={() => setFilters({ ...filters, type })}
                      rightSection={filters.type === type && <IconChevronRight size={14} />}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
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
                </Menu.Dropdown>
              </Menu>
              <Button
                variant="light"
                leftSection={<IconFolders size={16} />}
                onClick={() => setFilters({ ...filters, folder: filters.folder === 'all' ? folders[1] : 'all' })}
              >
                {filters.folder === 'all' ? 'All Folders' : filters.folder}
              </Button>
              <ActionIcon
                variant="light"
                onClick={() => setFilters({
                  ...filters,
                  sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
                })}
                aria-label="Toggle sort direction"
              >
                {filters.sortDirection === 'asc' ? (
                  <IconSortAscending size={16} />
                ) : (
                  <IconSortDescending size={16} />
                )}
              </ActionIcon>
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

          {/* Folder breadcrumbs if in a folder */}
          {filters.folder !== 'all' && (
            <Group gap="xs">
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setFilters({ ...filters, folder: 'all' })}
              >
                All Folders
              </Button>
              <IconChevronRight size={12} />
              <Text size="xs">{filters.folder}</Text>
            </Group>
          )}
        </Stack>
      </Card>

      {/* Assets Grid/List */}
      <ScrollArea h="calc(100vh - 300px)">
        {viewMode === 'grid' ? (
          <SimpleGrid cols={{ base: 2, sm: 2, md: 2, lg: 3 }} spacing="sm">
            {paginatedAssets.map(renderAssetCard)}
          </SimpleGrid>
        ) : (
          <Stack gap="xs">
            {paginatedAssets.map(renderAssetList)}
          </Stack>
        )}
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}

      {/* Preview Modal */}
      <Modal
        opened={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        size="xl"
        title={
          <Group gap="xs">
            <Text fw={500}>{previewAsset?.originalName}</Text>
            <Text size="sm" c="dimmed">
              ({previewAsset ? formatFileSize(previewAsset.size) : ''})
            </Text>
          </Group>
        }
      >
        {previewAsset && isImage(previewAsset) && (
          <Stack gap="md">
            <Image
              src={getThumbnailUrl(previewAsset)}
              alt={previewAsset.originalName}
              fit="contain"
              style={{ maxHeight: '70vh' }}
            />
            <Group justify="center" gap="md">
              <Button 
                variant="light"
                leftSection={<IconEye size={16} />}
                component="a"
                href={previewAsset.presignedUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Full Size
              </Button>
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                component="a"
                href={previewAsset.directUrl}
                download={previewAsset.originalName}
              >
                Download
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
} 