import React, { useState } from 'react';
import { SimpleGrid, Card, Center, Image, Text, Group, Button, Stack, Modal, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconFile, IconDownload, IconEye, IconPhoto, IconFileTypePdf, IconFileTypeXls, IconFileTypeDoc, IconFileTypeZip, IconFile3d } from '@tabler/icons-react';
import { Asset } from '../api/client';

interface AssetGridProps {
  assets: Asset[];
  organization: string;
  project: string;
  mission: string;
  getThumbnailUrl: (asset: Asset) => string;
}

export function AssetGrid({ assets, organization, project, mission, getThumbnailUrl }: AssetGridProps) {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

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

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 2, md: 2 , lg: 3}} spacing="sm">
        {assets.map((asset) => {
          const FileIcon = getFileIcon(asset);
          return (
            <Card key={asset.id} withBorder padding="lg" radius="md">
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
                      {asset.originalName}
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
        })}
      </SimpleGrid>

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
    </>
  );
} 