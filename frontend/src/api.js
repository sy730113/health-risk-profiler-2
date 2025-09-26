import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This will be proxied to http://localhost:3000/api
  timeout: 60000, // 60 seconds timeout for file processing
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      error.message = 'Unable to connect to server. Please make sure the backend is running on port 3000.';
    } else if (error.response) {
      error.message = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      error.message = 'No response from server. Please check if the backend is running.';
    } else {
      error.message = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

export { api };