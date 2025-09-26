// src/services/api.js - UPDATED with full admin functionality
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
  (error) => Promise.reject(error)
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
    const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return api.get(`/doctors/${doctorId}/slots?date=${formattedDate}`);
  },
  getDoctors: () => api.get('/doctors'),
  getDoctor: (doctorId) => api.get(`/doctors/${doctorId}`)
};

// Medical Records API
export const recordsService = {
  getMyRecords: () => api.get('/medical-records/my'),
  getPatientRecords: (patientId) => api.get(`/patients/${patientId}/records`),
  createRecord: (patientId, recordData) => api.post(`/patients/${patientId}/records`, recordData)
};

// Analytics API
export const analyticsService = {
  getDoctorAnalytics: (period = 'month') => api.get(`/analytics/practice?period=${period}`),
  getSystemAnalytics: () => api.get('/api/admin/analytics/')
};

// ============= ENHANCED ADMIN API =============

export const adminService = {
  // User Management - Full CRUD
  getUsers: (params = {}) => {
    return api.get('/api/admin/users/', { params });
  },
  
  getUserDetail: (userId) => api.get(`/api/admin/users/${userId}/`),
  
  createUser: (userData) => api.post('/api/admin/users/', userData),
  
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}/`, userData),
  
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}/`),
  
  // Analytics
  getAnalytics: () => api.get('/api/admin/analytics/'),
  
  // Subscription Plans Management
  getSubscriptionPlans: () => api.get('/api/admin/subscription-plans/'),
  
  getSubscriptionPlan: (planId) => api.get(`/api/admin/subscription-plans/${planId}/`),
  
  createSubscriptionPlan: (planData) => api.post('/api/admin/subscription-plans/', planData),
  
  updateSubscriptionPlan: (planId, planData) => api.put(`/api/admin/subscription-plans/${planId}/`, planData),
  
  deleteSubscriptionPlan: (planId) => api.delete(`/api/admin/subscription-plans/${planId}/`),
  
  // User Subscription Management
  assignUserSubscription: (userId, plan) => 
    api.post(`/api/admin/users/${userId}/subscription/`, { action: 'assign', plan }),
  
  cancelUserSubscription: (userId) => 
    api.post(`/api/admin/users/${userId}/subscription/`, { action: 'cancel' }),
  
  applyDiscount: (userId, discountPercent) => 
    api.post(`/api/admin/users/${userId}/subscription/`, { 
      action: 'discount', 
      discount_percent: discountPercent 
    })
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const formatApiResponse = (response) => {
  return {
    data: response.data,
    status: response.status,
    success: response.status >= 200 && response.status < 300
  };
};