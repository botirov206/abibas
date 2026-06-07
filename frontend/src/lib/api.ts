import axios from 'axios';

// Local dev: set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local (direct to FastAPI).
// Docker/production: leave unset — browser calls /api/v1/* and Next.js rewrites to the backend.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
