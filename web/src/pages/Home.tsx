import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconPhoto, IconRocket } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={1}>Welcome to SkyStore</Title>
          <Text c="dimmed" size="lg">
            Manage your missions and assets in one place
          </Text>
        </div>

        <Group>
          <Button
            component={Link}
            to="/create-mission"
            leftSection={<IconRocket size="1rem" />}
            variant="filled"
          >
            Create New Mission
          </Button>
          <Button
            component={Link}
            to="/mission-assets"
            leftSection={<IconPhoto size="1rem" />}
            variant="light"
          >
            View Mission Assets
          </Button>
        </Group>
      </Stack>
    </Container>
  );
} 