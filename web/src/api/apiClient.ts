import { RestResult } from '@skystore/core_types';
import { treaty } from '@elysiajs/eden';
import type { App } from '../../../server/src/index';
import { getToken } from '../utils/authUtils';
import {API_URL} from '../constants';
// Create Eden Treaty client with auth header
export const api = treaty<App>(API_URL, {
  fetcher: (url, init) => {
    // Get the auth token from localStorage
    const token = getToken();
    
    // Add Authorization header if token exists
    if (token) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    return fetch(url, init);
  }
});

// Helper to wrap API calls with proper typing
export async function apiCall<T>(
  promise: Promise<{ data?: T; error?: any }>
): Promise<RestResult<T>> {
  try {
    const { data, error } = await promise;
    
    if (error) {
      // Handle unauthorized errors (401) by clearing token from localStorage
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
      }
      
      return {
        http_status: error.status || 500,
        success: false,
        message: error.value?.message || error.message || 'An unexpected error occurred',
        content: null
      } as RestResult<T>;
    }
    
    return {
      http_status: 200,
      success: true,
      message: 'Success',
      content: data as T
    };
  } catch (error: any) {
    return {
      http_status: 500,
      success: false,
      message: error.message || 'An unexpected error occurred',
      content: null
    } as RestResult<T>;
  }
}

// Type for API error responses
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Add a helper that automatically unwraps the RestResult and throws an error if not successful
export async function safeApiCall<T>(
  promise: Promise<{ data?: T; error?: any }>
): Promise<T> {
  const result = await apiCall(promise);
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.content;
}