import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const helpRequestsAPI = {
  getAll: (params) => api.get('/help-requests', { params }),
  getById: (id) => api.get(`/help-requests/${id}`),
  create: (data) => api.post('/help-requests', data),
  resolve: (id, data) => api.patch(`/help-requests/${id}/resolve`, data),
  markUnresolved: (id, data) => api.patch(`/help-requests/${id}/unresolved`, data),
  delete: (id) => api.delete(`/help-requests/${id}`),
};

export const knowledgeBaseAPI = {
  getAll: (params) => api.get('/knowledge-base', { params }),
  search: (query) => api.get('/knowledge-base/search', { params: { q: query } }),
  getStats: () => api.get('/knowledge-base/stats'),
  create: (data) => api.post('/knowledge-base', data),
  update: (id, data) => api.patch(`/knowledge-base/${id}`, data),
  delete: (id) => api.delete(`/knowledge-base/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
};

export default api;
