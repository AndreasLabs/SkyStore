import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextInput,
  Paper,
  Title,
  Text,
  Container,
  Button,
  Anchor,
  Alert,
  Group,
} from '@mantine/core';
import { useRequestPasswordReset } from '../hooks/useAuthHooks';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const { mutate: requestReset, isPending, error, isError } = useRequestPasswordReset();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    requestReset(email, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Reset your password</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Enter your email to receive a password reset link
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {submitted ? (
          <Alert color="green" title="Email sent">
            If an account exists with the email you entered, we've sent instructions to reset your password.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {isError && (
              <Alert color="red" mb="md">
                {error instanceof Error ? error.message : 'Failed to request password reset. Please try again.'}
              </Alert>
            )}
            
            <TextInput
              label="Email"
              placeholder="Your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Group justify="space-between" mt="lg">
              <Anchor component={Link} to="/login" size="sm">
                Back to login
              </Anchor>
            </Group>
            
            <Button fullWidth mt="xl" type="submit" loading={isPending}>
              Reset Password
            </Button>
          </form>
        )}
      </Paper>
      
      {submitted && (
        <Text ta="center" mt="md">
          <Anchor component={Link} to="/login" fw={700}>
            Return to login
          </Anchor>
        </Text>
      )}
    </Container>
  );
} 