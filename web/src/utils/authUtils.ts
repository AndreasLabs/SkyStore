/**
 * Authentication utilities for handling JWT tokens
 */

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Check if user is in session-only mode (token should expire with browser session)
export const isSessionOnly = (): boolean => {
  return sessionStorage.getItem('auth_session') === 'true';
};

// Set session-only mode
export const setSessionOnly = (): void => {
  sessionStorage.setItem('auth_session', 'true');
};

// Clear session-only mode
export const clearSessionOnly = (): void => {
  sessionStorage.removeItem('auth_session');
};

// Parse JWT token without library dependency
export const parseJwt = (token: string): any => {
  try {
    // Get the payload part of the JWT (second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    // Compare expiration time with current time
    // JWT exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Setup axios auth header with JWT token
export const setupAuthHeader = (axios: any): void => {
  const token = getToken();
  
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Clear all auth data (for logout)
export const clearAuth = (): void => {
  removeToken();
  clearSessionOnly();
}; 