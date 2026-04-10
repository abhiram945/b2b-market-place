import axios from 'axios';
import { apiBasePath } from './utils/runtimeConfig';
import { getAccessToken, setAccessToken } from './utils/authToken';

const api = axios.create({
  baseURL: apiBasePath,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for cookies
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 and refresh token
let isRefreshing = false;
let failedQueue: any[] = [];
let hasHandledSessionExpiry = false;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 503) {
      if (window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance';
      }
      return Promise.reject(error);
    }
    
    // Do NOT attempt refresh for login requests or if the request has already been retried
    const isLoginRequest = originalRequest.url && originalRequest.url.includes('/auth/login');
    const isRefreshRequest = originalRequest.url && originalRequest.url.includes('/auth/refresh');
    
    if (status === 401 && originalRequest && !originalRequest._retry && !isLoginRequest && !isRefreshRequest) {
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        const newToken = data.token;
        setAccessToken(newToken);
        hasHandledSessionExpiry = false;
        
        // Update the authorization header for ALL subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        // Also update for the current failed request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        isRefreshing = false;

        // CRITICAL: Return the same api call but with the NEW token
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh token failed or expired, logout user
        localStorage.removeItem('cart');
        setAccessToken(null);
        delete api.defaults.headers.common['Authorization'];

        // Avoid repeated console noise and redirect loops on expected session expiry
        if (!hasHandledSessionExpiry) {
          hasHandledSessionExpiry = true;
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    if (status === 401 && isRefreshRequest) {
      localStorage.removeItem('cart');
      setAccessToken(null);
      delete api.defaults.headers.common['Authorization'];
    }

    // For login requests or other non-refreshable 401s, return the original error
    return Promise.reject(error);
  }
);

export default api;
