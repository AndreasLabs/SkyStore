import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Anchor,
  Alert,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { useRegister } from '../hooks/useAuthHooks';

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  
  const [passwordError, setPasswordError] = useState('');
  const { mutate: register, isPending, error, isError } = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear password error when user types in either password field
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Password strength validation
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    const { confirmPassword, ...registerData } = formData;
    
    register(registerData, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <Container size={600} my={40}>
      <Title ta="center">Create your SkyStore account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Fill out the form below to register
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {isError && (
            <Alert color="red" mb="md">
              {error instanceof Error ? error.message : 'Registration failed. Please try again.'}
            </Alert>
          )}
          
          <TextInput
            label="Username"
            placeholder="Choose a username"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
          />
          
          <TextInput
            label="Email"
            placeholder="Your email address"
            name="email"
            required
            mt="md"
            value={formData.email}
            onChange={handleChange}
          />
          
          <Divider label="Personal Information" labelPosition="center" my="lg" />
          
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="First Name"
              placeholder="Your first name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
            
            <TextInput
              label="Last Name"
              placeholder="Your last name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </SimpleGrid>
          
          <Divider label="Security" labelPosition="center" my="lg" />
          
          <PasswordInput
            label="Password"
            placeholder="Create a strong password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            error={passwordError}
          />
          
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            name="confirmPassword"
            required
            mt="md"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={passwordError}
          />
          
          <Button fullWidth mt="xl" type="submit" loading={isPending}>
            Create Account
          </Button>
        </form>
      </Paper>

      <Text ta="center" mt="md">
        Already have an account?{' '}
        <Anchor component={Link} to="/login" fw={700}>
          Log in
        </Anchor>
      </Text>
    </Container>
  );
} 