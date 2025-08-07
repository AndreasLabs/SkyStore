import { RestResult } from '@skystore/core_types';
import { treaty } from '@elysiajs/eden';
import type { App } from '../../../server/src/index';
import { getToken } from '../utils/authUtils';
import {API_URL} from '../constants';
// Create Eden Treaty client with auth header
export const api = treaty<App>(API_URL, {
  fetcher: (url: RequestInfo | URL, init?: RequestInit) => {
    // Get the auth token from localStorage
    const token = getToken();
    
    if (init) {
    // Add Authorization header if token exists
    if (token) {
      init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`
        };
      }
    }
    
    return fetch(url, init);
  }
});