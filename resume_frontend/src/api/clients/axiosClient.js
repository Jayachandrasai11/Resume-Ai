import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Track if we're currently refreshing a token to prevent race conditions
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create the axios instance
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 second timeout for complex matching operations
});

// Helper function to get tokens from storage
export const getTokens = () => {
  // Try localStorage first (for "Remember Me" functionality)
  let accessToken = localStorage.getItem('token');
  let refreshToken = localStorage.getItem('refresh');
  let storage = localStorage;

  // If not in localStorage, check sessionStorage
  if (!accessToken) {
    accessToken = sessionStorage.getItem('token');
    refreshToken = sessionStorage.getItem('refresh');
    storage = sessionStorage;
  }

  return { accessToken, refreshToken, storage };
};

// Helper function to save tokens to storage
export const saveTokens = (accessToken, refreshToken) => {
  const storage = localStorage.getItem('token') ? localStorage : 
                  sessionStorage.getItem('token') ? sessionStorage : 
                  localStorage; // Default to localStorage for persistence

  storage.setItem('token', accessToken);
  if (refreshToken) {
    storage.setItem('refresh', refreshToken);
  }
};

// Function to attempt token refresh
const attemptTokenRefresh = async () => {
  const { refreshToken } = getTokens();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: refreshToken
    });
    
    const { access, refresh } = response.data;
    saveTokens(access, refresh);
    
    return access;
  } catch (error) {
    // Refresh failed - clear all tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    
    throw error;
  }
};

// Request interceptor - add auth token and cache buster
http.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Add cache buster to GET requests
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh and 401 errors
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if it's a token-related error
      const errorDetail = error.response?.data?.detail || '';
      const isTokenError = typeof errorDetail === 'string' && 
        (errorDetail.toLowerCase().includes('token') || 
         errorDetail.toLowerCase().includes('invalid') || 
         errorDetail.toLowerCase().includes('expired'));

      // If it's a token error and we haven't retried yet
      if (isTokenError && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Wait for the current refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return http(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        try {
          const newAccessToken = await attemptTokenRefresh();
          processQueue(null, newAccessToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return http(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Don't redirect if already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

        // Just reject the error - the calling code should handle it
      if (!isTokenError) {
        return Promise.reject(error);
      }
    }

    // For other errors, just pass them through
    return Promise.reject(error);
  }
);

/**
 * Normalize DRF list responses.
 * - If response is an array -> return it
 * - If response is paginated { results: [] } -> return results
 */
export function asList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}
