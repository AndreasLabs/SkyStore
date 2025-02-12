import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent automatic refetches on window focus
      refetchOnMount: 'always', // Always fetch fresh data when component mounts
    },
  },
}); 