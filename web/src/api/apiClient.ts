import axios, { AxiosError, AxiosInstance } from 'axios';
import { RestResult } from '@skystore/core_types';

// API Configuration
const API_URL = 'http://localhost:4000';

// Create axios instance with default config
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<RestResult<any>>) => {
    // Get error response in our format
    const errorResponse = error.response?.data;
    
    if (errorResponse) {
      return Promise.reject(errorResponse);
    }

    // If we don't have a proper error response, create one
    return Promise.reject({
      http_status: error.response?.status || 500,
      success: false,
      message: error.message || 'An unexpected error occurred',
      content: null
    } as RestResult<null>);
  }
);

// Helper to wrap API calls with proper typing
export async function apiCall<T>(promise: Promise<RestResult<T>>): Promise<RestResult<T>> {
  try {
    return await promise;
  } catch (error) {
    if ((error as any).success === false) {
      return error as RestResult<T>;
    }
    throw error;
  }
}

// Type for API error responses
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Add a helper that automatically unwraps the RestResult and throws an error if not successful
export async function safeApiCall<T>(promise: Promise<RestResult<T>>): Promise<T> {
  const result = await apiCall(promise);
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.content;
} 