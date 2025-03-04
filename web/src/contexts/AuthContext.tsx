import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrentUser, useLogout } from '../hooks/useAuthHooks';
import { clearAuth } from '../utils/authUtils';

// Define user type
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const { mutate: logout } = useLogout();
  
  // Check token validity on mount
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  const handleLogout = () => {
    logout();
    clearAuth();
  };
  
  const value = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 