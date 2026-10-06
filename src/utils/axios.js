import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // If the data is FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const isKiosk = window.location.pathname.startsWith('/kiosk');
    const token = isKiosk 
      ? (localStorage.getItem('kiosk_token') || localStorage.getItem('token'))
      : (localStorage.getItem('token') || localStorage.getItem('kiosk_token'));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Automatically redirect to login if token is invalid or expired
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/kiosk')) {
        const isAuthAttempt = error.config?.url?.includes('/kiosk/exit') || error.config?.url?.includes('/kiosk/login');
        if (!isAuthAttempt) {
          localStorage.removeItem('kiosk_token');
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
           window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
