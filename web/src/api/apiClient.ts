import { RestResult } from '@skystore/core_types';
import { treaty } from '@elysiajs/eden';
import type { App } from '../../../server/src/index';

// Create Eden Treaty client
export const api = treaty<App>('http://localhost:4000');

// Helper to wrap API calls with proper typing
export async function apiCall<T>(
  promise: Promise<{ data?: T; error?: any }>
): Promise<RestResult<T>> {
  try {
    const { data, error } = await promise;
    
    if (error) {
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
    };U
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