import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance for authentication
export const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create axios instance for general API calls
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor to handle common errors
const handleResponse = (response) => response;

const handleError = (error) => {
  // Handle 401 errors (unauthorized)
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  // Handle network errors
  if (!error.response) {
    console.error('Network error:', error.message);
  }
  
  return Promise.reject(error);
};

// Add interceptors to both instances
[authAPI, apiClient].forEach(instance => {
  instance.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
  instance.interceptors.response.use(handleResponse, handleError);
});

// Authentication API calls
export const authService = {
  // Register user
  register: async (userData) => {
    const response = await authAPI.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await authAPI.post('/auth/login', { email, password });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await authAPI.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await authAPI.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await authAPI.put('/auth/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await authAPI.post('/auth/logout');
    return response.data;
  }
};

// Patient API calls (for future use)
export const patientService = {
  // Get all patients
  getPatients: async () => {
    const response = await apiClient.get('/patients');
    return response.data;
  },

  // Get patient by ID
  getPatient: async (id) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  // Create patient
  createPatient: async (patientData) => {
    const response = await apiClient.post('/patients', patientData);
    return response.data;
  },

  // Update patient
  updatePatient: async (id, patientData) => {
    const response = await apiClient.put(`/patients/${id}`, patientData);
    return response.data;
  },

  // Delete patient
  deletePatient: async (id) => {
    const response = await apiClient.delete(`/patients/${id}`);
    return response.data;
  }
};

// Appointment API calls (for future use)
export const appointmentService = {
  // Get appointments
  getAppointments: async () => {
    const response = await apiClient.get('/appointments');
    return response.data;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await apiClient.post('/appointments', appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id, appointmentData) => {
    const response = await apiClient.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  }
};

// Visit API calls (for future use)
export const visitService = {
  // Get visits
  getVisits: async () => {
    const response = await apiClient.get('/visits');
    return response.data;
  },

  // Create visit
  createVisit: async (visitData) => {
    const response = await apiClient.post('/visits', visitData);
    return response.data;
  },

  // Update visit
  updateVisit: async (id, visitData) => {
    const response = await apiClient.put(`/visits/${id}`, visitData);
    return response.data;
  }
};

export default apiClient;