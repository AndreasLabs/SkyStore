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
  LoadingOverlay,
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

// Mock user context
const useCurrentUser = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  return {
    user: currentUserId,
    isLoading: false,
    error: null,
    setCurrentUserId,
    setCurrentUser: (user: any) => console.log('Setting user', user),
  };
};

// Mock user hooks
const useCreateUser = () => {
  return {
    mutateAsync: async (userData: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { uuid: crypto.randomUUID(), ...userData };
    },
    isPending: false,
  };
};

const useUser = (userId: string) => {
  const [mockUser, setMockUser] = useState<any>(null);
  
  useEffect(() => {
    if (userId) {
      // Simulate fetching user data
      setTimeout(() => {
        setMockUser({
          uuid: userId,
          name: 'John Doe',
          email: 'john.doe@example.com',
          bio: 'Software developer with a passion for building great products.',
          location: 'San Francisco, CA',
          company: 'SkyStore Inc.',
          website: 'https://example.com',
          avatar: null,
          joinDate: new Date().toISOString(),
        });
      }, 300);
    }
  }, [userId]);
  
  return {
    data: mockUser,
    isLoading: !mockUser && !!userId,
    error: null,
  };
};

const useUpdateUser = () => {
  return {
    mutate: (params: any, options: any) => {
      // Simulate API call
      setTimeout(() => {
        if (options?.onSuccess) options.onSuccess();
      }, 500);
    },
    isPending: false,
  };
};

function CreateUserForm() {
  const { setCurrentUserId } = useCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    company: '',
    website: '',
  });

  const createUserMutation = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutateAsync({ ...formData, id: crypto.randomUUID() })
      .then(data => {
        setCurrentUserId(data.uuid);
        notifications.show({
          title: 'Success',
          message: 'User profile created successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      })
      .catch(error => {
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to create user profile',
          color: 'red',
        });
      });
  };

  return (
    <Container size="md" py="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack gap="xl">
          <div>
            <Title order={2}>Create Your Profile</Title>
            <Text c="dimmed">Set up your user profile to get started</Text>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Textarea
                label="Bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                minRows={3}
              />

              <Group grow>
                <TextInput
                  label="Location"
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <TextInput
                  label="Company"
                  placeholder="Your company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </Group>

              <TextInput
                label="Website"
                placeholder="Your website URL"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />

              <Button
                type="submit"
                loading={createUserMutation.isPending}
                mt="md"
              >
                Create Profile
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}

export function Profile() {
  const { user: currentUserId, isLoading: contextLoading, error: contextError, setCurrentUser } = useCurrentUser();
  const { data: currentUser, isLoading: userLoading, error: userError } = useUser(currentUserId || '');
  const updateUserMutation = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);

  const updateUserInPlace = (updates: Partial<typeof currentUser>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...(typeof updates === 'function' ? updates(currentUser) : updates) });
    }
  };

  const handleSave = () => {
    if (!currentUser) return;

    updateUserMutation.mutate({
      uuid: currentUser.uuid,
      data: {
        name: currentUser.name,
        email: currentUser.email,
        bio: currentUser.bio,
        location: currentUser.location,
        company: currentUser.company,
        website: currentUser.website,
      }
    }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  if (contextLoading || userLoading) {
    return (
      <Container size="md" py="xl">
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (contextError || userError || !currentUser) {
    return <CreateUserForm />;
  }

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
                src={currentUser.avatar}
                alt={currentUser.name}
                size="xl"
                radius="xl"
                color="blue"
              >
                {currentUser.name.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text size="xl" fw={500}>{currentUser.name}</Text>
                <Text size="sm" c="dimmed">{currentUser.email}</Text>
                <Text size="sm" c="dimmed">Member since {new Date(currentUser.joinDate).toLocaleDateString()}</Text>
              </div>
              <Button
                variant="light"
                onClick={() => setIsEditing(!isEditing)}
                loading={updateUserMutation.isPending}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Group>

            {isEditing ? (
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Full Name"
                    value={currentUser.name}
                    onChange={(e) => updateUserInPlace({ name: e.target.value })}
                  />
                  <TextInput
                    label="Email"
                    value={currentUser.email}
                    onChange={(e) => updateUserInPlace({ email: e.target.value })}
                  />
                </Group>

                <Textarea
                  label="Bio"
                  value={currentUser.bio}
                  onChange={(e) => updateUserInPlace({ bio: e.target.value })}
                  minRows={3}
                />

                <Group grow>
                  <TextInput
                    label="Location"
                    value={currentUser.location}
                    onChange={(e) => updateUserInPlace({ location: e.target.value })}
                  />
                  <TextInput
                    label="Company"
                    value={currentUser.company}
                    onChange={(e) => updateUserInPlace({ company: e.target.value })}
                  />
                </Group>

                <TextInput
                  label="Website"
                  value={currentUser.website}
                  onChange={(e) => updateUserInPlace({ website: e.target.value })}
                />

                <Group justify="flex-end">
                  <Button variant="light" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={updateUserMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="md">
                <div>
                  <Text fw={500}>Bio</Text>
                  <Text size="sm">{currentUser.bio}</Text>
                </div>

                <Divider />

                <Group grow>
                  <div>
                    <Text fw={500}>Location</Text>
                    <Text size="sm">{currentUser.location}</Text>
                  </div>
                  <div>
                    <Text fw={500}>Company</Text>
                    <Text size="sm">{currentUser.company}</Text>
                  </div>
                </Group>

                <div>
                  <Text fw={500}>Website</Text>
                  <Text
                    size="sm"
                    component="a"
                    href={currentUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    c="blue"
                  >
                    {currentUser.website}
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