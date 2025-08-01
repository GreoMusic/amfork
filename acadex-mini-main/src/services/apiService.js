// apiService.js - Updated for Microservices Architecture

import axios from "axios";

// Microservices URLs
const MICROSERVICES_CONFIG = {
  development: {
    AUTH_SERVICE: 'http://localhost:3001',
    CLASS_SERVICE: 'http://localhost:3002',
    ASSIGNMENT_SERVICE: 'http://localhost:3003',
    GRADING_SERVICE: 'http://localhost:3004',
    FILE_SERVICE: 'http://localhost:3005',
    SUBSCRIPTION_SERVICE: 'http://localhost:3006',
    NOTIFICATION_SERVICE: 'http://localhost:3007',
    ANALYTICS_SERVICE: 'http://localhost:3008',
    API_GATEWAY: 'http://localhost:3000'
  },
  production: {
    AUTH_SERVICE: 'https://auth-service.railway.app',
    CLASS_SERVICE: 'https://class-service.railway.app',
    ASSIGNMENT_SERVICE: 'https://assignment-service.railway.app',
    GRADING_SERVICE: 'https://grading-service.fly.dev',
    FILE_SERVICE: 'https://file-service.railway.app',
    SUBSCRIPTION_SERVICE: 'https://subscription-service.railway.app',
    NOTIFICATION_SERVICE: 'https://notification-service.railway.app',
    ANALYTICS_SERVICE: 'https://analytics-service.railway.app',
    API_GATEWAY: 'https://api-gateway.railway.app'
  }
};

const environment = process.env.NODE_ENV || 'development';
const SERVICES = MICROSERVICES_CONFIG[environment];

// Create axios instances for each service
const authApi = axios.create({ baseURL: SERVICES.AUTH_SERVICE });
const classApi = axios.create({ baseURL: SERVICES.CLASS_SERVICE });
const assignmentApi = axios.create({ baseURL: SERVICES.ASSIGNMENT_SERVICE });
const gradingApi = axios.create({ baseURL: SERVICES.GRADING_SERVICE });
const fileApi = axios.create({ baseURL: SERVICES.FILE_SERVICE });
const subscriptionApi = axios.create({ baseURL: SERVICES.SUBSCRIPTION_SERVICE });
const notificationApi = axios.create({ baseURL: SERVICES.NOTIFICATION_SERVICE });
const analyticsApi = axios.create({ baseURL: SERVICES.ANALYTICS_SERVICE });

// Add request interceptor to include JWT token
const addAuthHeader = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

[authApi, classApi, assignmentApi, gradingApi, fileApi, subscriptionApi, notificationApi, analyticsApi].forEach(api => {
  api.interceptors.request.use(addAuthHeader);
});

// =============================================================================
// AUTHENTICATION SERVICE
// =============================================================================

export const loginPost = async (credentials) => {
  try {
    const response = await authApi.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const registerPost = async (userData) => {
  try {
    const response = await authApi.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await authApi.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await authApi.post('/api/auth/reset-password', { token, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// CLASS SERVICE
// =============================================================================

export const createClass = async (classData) => {
  try {
    const response = await classApi.post('/api/classes', classData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getClasses = async () => {
  try {
    const response = await classApi.get('/api/classes');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getClassQR = async (classId) => {
  try {
    const response = await classApi.get(`/api/classes/${classId}/qr`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const joinClass = async (classId, joinCode) => {
  try {
    const response = await classApi.post(`/api/classes/${classId}/join`, { joinCode });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// ASSIGNMENT SERVICE
// =============================================================================

export const createAssignment = async (assignmentData) => {
  try {
    const response = await assignmentApi.post('/api/assignments', assignmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAssignments = async (classId) => {
  try {
    const response = await assignmentApi.get(`/api/assignments/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const response = await assignmentApi.post(`/api/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// GRADING SERVICE
// =============================================================================

export const evaluatePaper = async (fileId, options = {}) => {
  try {
    const response = await gradingApi.post(`/api/grading/evaluate/${fileId}`, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateLisaPrompt = async (context) => {
  try {
    const response = await gradingApi.post('/api/grading/lisa-prompt', context);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const preAnalysis = async (fileId, analysisData) => {
  try {
    const response = await gradingApi.post('/api/grading/pre-analysis', { fileId, ...analysisData });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// FILE SERVICE
// =============================================================================

export const uploadFile = async (file, classId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId);
    
    const response = await fileApi.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getFiles = async (classId) => {
  try {
    const response = await fileApi.get(`/api/files/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    const response = await fileApi.delete(`/api/files/${fileId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// SUBSCRIPTION SERVICE
// =============================================================================

export const getPackages = async () => {
  try {
    const response = await subscriptionApi.get('/api/subscriptions/packages');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createSubscription = async (subscriptionData) => {
  try {
    const response = await subscriptionApi.post('/api/subscriptions/create', subscriptionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMySubscription = async () => {
  try {
    const response = await subscriptionApi.get('/api/subscriptions/my-subscription');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const checkUsage = async () => {
  try {
    const response = await subscriptionApi.post('/api/subscriptions/check-usage');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// NOTIFICATION SERVICE
// =============================================================================

export const sendNotification = async (notificationData) => {
  try {
    const response = await notificationApi.post('/api/notifications/send', notificationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserNotifications = async () => {
  try {
    const response = await notificationApi.get('/api/notifications/user-notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// ANALYTICS SERVICE
// =============================================================================

export const trackUsage = async (usageData) => {
  try {
    const response = await analyticsApi.post('/api/analytics/track-usage', usageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAnalytics = async (filters = {}) => {
  try {
    const response = await analyticsApi.get('/api/analytics/reports', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// =============================================================================
// LEGACY SUPPORT (for backward compatibility)
// =============================================================================

// Keep the old API functions for backward compatibility
const host = window.location.hostname;
const siteUrl = host === 'localhost' 
  ? import.meta.env.VITE_API_URL 
  : import.meta.env.VITE_API_URL_PROD;
const apiUrl = siteUrl + '/api';

export const postReuest = async (data, url_segment, token) => {
  try {
    const response = await fetch(`${apiUrl}/${url_segment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in post request:", error);
    throw error;
  }
};

export const getReuest = async (url_segment, token) => {
  try {
    const response = await fetch(`${apiUrl}/${url_segment}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in get request:", error);
    throw error;
  }
};

// Legacy packages function
export const packages = async () => {
  return getPackages();
};
