import axios from 'axios';
import { authService } from '../utils/auth';


// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      authService.logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  // ============= AUTH =============
  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  getMe() {
    return api.get('/auth/me');
  },

  register(data){
    return api.post('/auth/register', data);
  },

  // ============= SOCIETY =============
  registerSociety(societyData) {
    return api.post('/society/register', societyData);
  },

  getSociety(societyId) {
    return api.get(`/society/${societyId}`);
  },

  getAllSocieties() {
    return api.get('/society');
  },

  getPublicSocieties() {
    return api.get('/society/public/list');
  },

  // ============= PROOF =============
  uploadProof(formData) {
    return api.post('/proof/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getSocietyProofs(societyId, params = {}) {
    return api.get(`/proof/society/${societyId}`, { params });
  },

  getProof(logId) {
    return api.get(`/proof/${logId}`);
  },

  // ============= COMPLIANCE =============
  evaluateCompliance(societyId) {
    return api.post('/compliance/evaluate', { societyId });
  },

  getRebate(societyId) {
    return api.get(`/rebate/${societyId}`);
  },

  // ============= ADMIN =============
  getAdminDashboard() {
    return api.get('/admin/dashboard');
  },

  getAdminSocieties(params = {}) {
    return api.get('/admin/societies', { params });
  },

  getPendingProofs() {
    return api.get('/admin/proofs/pending');
  },

  approveProof(logId) {
    return api.post(`/admin/proof/${logId}/approve`);
  },

  rejectProof(logId, reason) {
    return api.post(`/admin/proof/${logId}/reject`, { reason });
  },

  // ============= RESIDENT =============
  getResidentSummary(societyId) {
    return api.get(`/resident/society/${societyId}/summary`);
  },

  // ============= HEATMAP =============
  getHeatmapData() {
    return api.get('/heatmap/ward');
  }
};

export default api;