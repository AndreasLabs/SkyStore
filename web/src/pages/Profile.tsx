import React from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Stack,
  Card,
  Avatar,
  Group,
  Button,
  TextInput,
  Textarea,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconUpload } from '@tabler/icons-react';

// Mock user data - in real app this would come from auth context/API
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: null,
  bio: 'Passionate about astronomy and aerial photography.',
  location: 'San Francisco, CA',
  company: 'Stellar Labs',
  website: 'https://johndoe.com',
  joinDate: '2023-01-01',
};

export function Profile() {
  const [profile, setProfile] = React.useState(mockUser);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    // In real app, this would call an API
    setIsEditing(false);
    notifications.show({
      title: 'Profile updated',
      message: 'Your profile has been successfully updated',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>Profile</Title>
          <Text c="dimmed">Manage your personal information</Text>
        </div>

        <Card withBorder>
          <Stack gap="xl">
            <Group>
              <Avatar
                src={profile.avatar}
                alt={profile.name}
                size="xl"
                radius="xl"
                color="blue"
              >
                {profile.name.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text size="xl" fw={500}>{profile.name}</Text>
                <Text size="sm" c="dimmed">{profile.email}</Text>
                <Text size="sm" c="dimmed">Member since {new Date(profile.joinDate).toLocaleDateString()}</Text>
              </div>
              <Button
                variant="light"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Group>

            {isEditing ? (
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                  <TextInput
                    label="Email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </Group>

                <Textarea
                  label="Bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  minRows={3}
                />

                <Group grow>
                  <TextInput
                    label="Location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                  <TextInput
                    label="Company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </Group>

                <TextInput
                  label="Website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />

                <Group justify="flex-end">
                  <Button variant="light" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="md">
                <div>
                  <Text fw={500}>Bio</Text>
                  <Text size="sm">{profile.bio}</Text>
                </div>

                <Divider />

                <Group grow>
                  <div>
                    <Text fw={500}>Location</Text>
                    <Text size="sm">{profile.location}</Text>
                  </div>
                  <div>
                    <Text fw={500}>Company</Text>
                    <Text size="sm">{profile.company}</Text>
                  </div>
                </Group>

                <div>
                  <Text fw={500}>Website</Text>
                  <Text
                    size="sm"
                    component="a"
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    c="blue"
                  >
                    {profile.website}
                  </Text>
                </div>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
} 