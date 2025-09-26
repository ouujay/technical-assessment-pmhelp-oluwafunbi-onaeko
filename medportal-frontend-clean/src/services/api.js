// src/services/api.js - Production Configuration
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://pmhelp-epegcmf5cmg2gmdd.southafricanorth-01.azurewebsites.net';

console.log('API Base URL:', BASE_URL); // For debugging

export const authAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medportal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medportal_token');
      localStorage.removeItem('medportal_user');
      window.location.href = '/login';
    }
    
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  login: (credentials) => authAPI.post('/auth/login', credentials),
  register: (userData) => authAPI.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => authAPI.post('/auth/refresh', { refresh: refreshToken })
};

// Subscription API
export const subscriptionService = {
  getCurrent: () => api.get('/subscriptions/current'),
  upgrade: (planData) => api.post('/subscriptions/upgrade', planData)
};

// Appointment API
export const appointmentService = {
  getMyAppointments: () => api.get('/appointments/my'),
  bookAppointment: (appointmentData) => {
    const bookingData = {
      doctor: appointmentData.doctor,
      start: appointmentData.start,
      end: appointmentData.end,
      visit_type: appointmentData.visit_type || 'in_person'
    };
    return api.post('/appointments/my', bookingData);
  },
  cancelAppointment: (appointmentId) => api.patch(`/appointments/my/${appointmentId}`, { status: 'canceled' }),
  getDoctorAppointments: () => api.get('/appointments'),
  updateAppointmentStatus: (appointmentId, status) => api.patch(`/appointments/${appointmentId}`, { status }),
  getDoctorSlots: (doctorId, date) => {
    const formattedDate = date instanceof Date ? 
      date.toISOString().split('T')[0] : date;
    return api.get(`/appointments/slots/${doctorId}?date=${formattedDate}`);
  }
};

// Medical Records API
export const recordService = {
  getMyRecords: () => api.get('/records/my'),
  getRecordDetail: (recordId) => api.get(`/records/my/${recordId}`),
  getAllRecords: () => api.get('/records'),
  createRecord: (recordData) => api.post('/records', recordData),
  updateRecord: (recordId, recordData) => api.patch(`/records/${recordId}`, recordData),
  deleteRecord: (recordId) => api.delete(`/records/${recordId}`)
};

// Analytics API
export const analyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getAppointmentStats: (params) => api.get('/analytics/appointments', { params })
};

// Admin API
export const adminService = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.patch(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getDoctors: () => api.get('/admin/doctors'),
  createDoctor: (doctorData) => api.post('/admin/doctors', doctorData)
};