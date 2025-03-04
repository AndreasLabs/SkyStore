import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/apiClient';

// Query keys for authentication
const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Types
interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface LoginData {
  identifier: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  created_at: Date;
  updated_at: Date;
}

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    [key: string]: any;
  };
  error?: string;
}

// API calls
const registerUser = async (data: RegisterData): Promise<User> => {
  const response = await api.auth.register.post(data);
  return response.data.data;
};

const loginUser = async (data: LoginData): Promise<{ user: User; token: string }> => {
  const response = await api.auth.login.post(data);
  
  if (response.error) {
    throw new Error(response.error.message || 'Login failed');
  }
  
  // Save token to localStorage
  if (response.data?.data?.token) {
    localStorage.setItem('auth_token', response.data.data.token);
  }
  
  return {
    user: response.data.data,
    token: response.data.data.token
  };
};

const logoutUser = async (): Promise<void> => {
  const response = await api.auth.logout.post({});
  localStorage.removeItem('auth_token');
  return response.data;
};

const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if we have a token
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    const response = await api.auth.me.get({});
    return response.data.data;
  } catch (error) {
    localStorage.removeItem('auth_token');
    return null;
  }
};

const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await api.auth['reset-password'].request.post({ email });
  return response.data;
};

const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await api.auth['reset-password'].confirm.post({ token, newPassword });
  return response.data;
};

// Hooks
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => registerUser(data),
    onSuccess: () => {
      // No need to invalidate queries as this is a new user
    }
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => loginUser(data),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data.user);
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.user() });
    }
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) => 
      resetPassword(token, newPassword),
  });
};

// Helper for checking if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user
  };
}; 