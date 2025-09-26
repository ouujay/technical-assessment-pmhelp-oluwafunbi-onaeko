// src/services/api.js - Hardcoded Production URL
import axios from 'axios';

// HARDCODED - No environment variables
const BASE_URL = 'https://pmhelp-epegcmf5cmg2gmdd.southafricanorth-01.azurewebsites.net';

console.log('🔗 API Base URL:', BASE_URL);

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
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medportal_token');
      localStorage.removeItem('medportal_user');
      window.location.href = '/login';
    }
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  login: (credentials) => authAPI.post('/api/auth/login', credentials),
  register: (userData) => authAPI.post('/api/auth/register', userData),
  getMe: () => api.get('/api/auth/me'),
  refreshToken: (refreshToken) => authAPI.post('/api/auth/refresh', { refresh: refreshToken })
};

// Subscription API
export const subscriptionService = {
  getCurrent: () => api.get('/api/subscriptions/current'),
  upgrade: (planData) => api.post('/api/subscriptions/upgrade', planData)
};

// Appointment API
export const appointmentService = {
  getMyAppointments: () => api.get('/api/appointments/my'),
  bookAppointment: (appointmentData) => {
    const bookingData = {
      doctor: appointmentData.doctor,
      start: appointmentData.start,
      end: appointmentData.end,
      visit_type: appointmentData.visit_type || 'in_person'
    };
    return api.post('/api/appointments/my', bookingData);
  },
  cancelAppointment: (appointmentId) => api.patch(`/api/appointments/my/${appointmentId}`, { status: 'canceled' }),
  getDoctorAppointments: () => api.get('/api/appointments'),
  updateAppointmentStatus: (appointmentId, status) => api.patch(`/api/appointments/${appointmentId}`, { status }),
  getDoctorSlots: (doctorId, date) => {
    const formattedDate = date instanceof Date ? 
      date.toISOString().split('T')[0] : date;
    return api.get(`/api/doctors/${doctorId}/slots?date=${formattedDate}`);
  },
  getDoctors: () => api.get('/api/doctors'),
  getDoctor: (doctorId) => api.get(`/api/doctors/${doctorId}`)
};

// Medical Records API
export const recordsService = {
  getMyRecords: () => api.get('/api/medical-records/my'),
  getPatientRecords: (patientId) => api.get(`/api/patients/${patientId}/records`),
  createRecord: (patientId, recordData) => api.post(`/api/patients/${patientId}/records`, recordData)
};

// Analytics API
export const analyticsService = {
  getDoctorAnalytics: (period = 'month') => api.get(`/api/analytics/practice?period=${period}`),
  getSystemAnalytics: () => api.get('/api/admin/analytics/')
};

// Admin API
export const adminService = {
  // User Management
  getUsers: (params = {}) => api.get('/api/admin/users/', { params }),
  getUserDetail: (userId) => api.get(`/api/admin/users/${userId}/`),
  createUser: (userData) => api.post('/api/admin/users/', userData),
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}/`, userData),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}/`),
  
  // Analytics
  getAnalytics: () => api.get('/api/admin/analytics/'),
  
  // Subscription Plans
  getSubscriptionPlans: () => api.get('/api/admin/subscription-plans/'),
  getSubscriptionPlan: (planId) => api.get(`/api/admin/subscription-plans/${planId}/`),
  createSubscriptionPlan: (planData) => api.post('/api/admin/subscription-plans/', planData),
  updateSubscriptionPlan: (planId, planData) => api.put(`/api/admin/subscription-plans/${planId}/`, planData),
  deleteSubscriptionPlan: (planId) => api.delete(`/api/admin/subscription-plans/${planId}/`),
  
  // User Subscriptions
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