import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
};

export const reviewAPI = {
  submit: (data) => API.post('/reviews/submit', data),
  getAll: (params) => API.get('/reviews', { params }),
  getOne: (id) => API.get(`/reviews/${id}`),
  delete: (id) => API.delete(`/reviews/${id}`),
  getStats: () => API.get('/reviews/stats/overview'),
};

export const analysisAPI = {
  analyze: (data) => API.post('/analysis/analyze', data),
};

export const aiAPI = {
  review: (data) => API.post('/ai/review', data),
  explain: (data) => API.post('/ai/explain', data),
  generateDocs: (data) => API.post('/ai/docs', data),
};

export const projectAPI = {
  create: (data) => API.post('/projects', data),
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  delete: (id) => API.delete(`/projects/${id}`),
};

export default API;
