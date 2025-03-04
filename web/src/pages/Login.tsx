import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Anchor,
  Stack,
  Alert,
  Box,
} from '@mantine/core';
import { useLogin } from '../hooks/useAuthHooks';

export function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { mutate: login, isPending, error, isError } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { identifier, password },
      {
        onSuccess: () => {
          // If remember me is checked, we'll use the default token expiry (7 days)
          // If not, we'll handle expiry in session storage (browser session only)
          if (!rememberMe) {
            sessionStorage.setItem('auth_session', 'true');
          }
          
          navigate('/');
        },
      }
    );
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome to SkyStore!</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Log in to access your files and assets
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {isError && (
            <Alert color="red" mb="md">
              {error instanceof Error ? error.message : 'Login failed. Please check your credentials.'}
            </Alert>
          )}
          
          <TextInput
            label="Username or Email"
            placeholder="Your username or email"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Group justify="space-between" mt="lg">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.currentTarget.checked)}
            />
            <Anchor component={Link} to="/reset-password" size="sm">
              Forgot password?
            </Anchor>
          </Group>
          
          <Button fullWidth mt="xl" type="submit" loading={isPending}>
            Sign in
          </Button>
        </form>
      </Paper>

      <Text ta="center" mt="md">
        Don&apos;t have an account?{' '}
        <Anchor component={Link} to="/register" fw={700}>
          Register
        </Anchor>
      </Text>
    </Container>
  );
} 