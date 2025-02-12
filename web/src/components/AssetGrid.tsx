import React, { useState } from 'react';
import { SimpleGrid, Card, Center, Image, Text, Group, Button, Stack, Modal } from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
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

  const handleView = (asset: Asset) => {
    if (!isImage(asset)) {
      // For non-images, open in new tab
      window.open(asset.presignedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For images, show in modal
    setPreviewAsset(asset);
  };

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {assets.map((asset) => (
          <Card key={asset.id} withBorder padding="lg">
            <Card.Section 
              style={{ cursor: 'pointer' }} 
              onClick={() => handleView(asset)}
            >
              {isImage(asset) ? (
                <Image
                  src={getThumbnailUrl(asset)}
                  height={160}
                  alt={asset.originalName}
                />
              ) : (
                <Center h={160} bg="gray.1">
                  <IconFile size={48} opacity={0.5} />
                </Center>
              )}
            </Card.Section>

            <Stack gap="xs" mt="md">
              <Text fw={500} truncate="end">
                {asset.originalName}
              </Text>
              <Text size="sm" c="dimmed">
                {new Date(asset.uploadedAt).toLocaleDateString()}
              </Text>
              <Group gap="xs">
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => handleView(asset)}
                >
                  {isImage(asset) ? 'Preview' : 'Open'}
                </Button>
                <Button
                  variant="light"
                  size="xs"
                  component="a"
                  href={asset.directUrl}
                  download={asset.originalName}
                >
                  Download
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      <Modal
        opened={!!previewAsset}
        onClose={() => setPreviewAsset(null)}

        title={previewAsset?.originalName}
        
      >
        {previewAsset && isImage(previewAsset) && (
          <Stack>
            <Image
              src={getThumbnailUrl(previewAsset)}

              alt={previewAsset.originalName}
            />
            <Group justify="center">
              <Button 
                variant="light"
                component="a"
                href={previewAsset.presignedUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Full Size
              </Button>
              <Button
                variant="light"
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