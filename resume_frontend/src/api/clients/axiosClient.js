import axios from 'axios';

// 🌐 CENTRALIZED PRODUCTION API CONFIGURATION 🌐
// 🌐 CENTRALIZED PRODUCTION API CONFIGURATION 🌐
const getBaseURL = () => {
  // Use VITE_API_BASE_URL as primary (convention for full path) 
  let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
  
  // 🛡️ FAILSAFE: Guarantee the /api/ namespace exists
  if (!url.includes('/api')) {
    url = url.endsWith('/') ? `${url}api/` : `${url}/api/`;
  }
  
  // Ensure trailing slash for Axios/Django consistency
  if (!url.endsWith('/')) url += '/';
  
  return url;
};

export const API_BASE_URL = getBaseURL();

// Runtime Diagnostic Logging
if (import.meta.env.PROD) {
  console.log('🚀 REC-AI Engine Initialized');
  console.log('📍 Neural Interface Base:', API_BASE_URL);
}

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
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second default timeout (Render cold start handling)
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
    const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
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

// Request interceptor - add auth token, cache buster and force trailing slash
http.interceptors.request.use(
  (config) => {
    // Force trailing slash for Django compatibility
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url += '/';
    } else if (config.url && !config.url.endsWith('/') && config.url.includes('?')) {
      const parts = config.url.split('?');
      if (!parts[0].endsWith('/')) {
        config.url = `${parts[0]}/?${parts[1]}`;
      }
    }

    // Dynamic timeout for heavy AI operations (prevent timeout during embeddings)
    if (config.url.includes('ranking') || config.url.includes('match') || config.url.includes('chat')) {
      config.timeout = 120000; // 2 minutes for AI tasks
    }

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

    // GLOBAL ERROR MAPPING
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error('⛔ Access Denied: Insufficient Permissions');
          break;
        case 500:
          console.error('💥 Server Error: Neural Engine failure');
          break;
        case 0:
          console.error('🌐 Network Error: Possible CORS blockage or Cold Start');
          break;
      }
    }

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
