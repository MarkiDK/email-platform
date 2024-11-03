import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const auth = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/register', data),
  
  logout: () => 
    api.post('/auth/logout'),
  
  me: () => 
    api.get('/auth/me'),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', data),
};

// Email Endpoints
export const emails = {
  getAll: (params?: { page?: number; search?: string; folder?: string }) =>
    api.get<PaginatedResponse<Email>>('/emails', { params }),
  
  get: (id: number) => 
    api.get<Email>(`/emails/${id}`),
  
  send: (data: EmailForm) => 
    api.post('/emails', data),
  
  delete: (id: number) => 
    api.delete(`/emails/${id}`),
  
  markAsRead: (id: number) => 
    api.patch(`/emails/${id}/read`),
  
  markAsUnread: (id: number) => 
    api.patch(`/emails/${id}/unread`),
  
  moveToTrash: (id: number) => 
    api.patch(`/emails/${id}/trash`),
  
  restore: (id: number) => 
    api.patch(`/emails/${id}/restore`),
};

// Contact Endpoints
export const contacts = {
  getAll: (params?: { page?: number; search?: string }) =>
    api.get<PaginatedResponse<Contact>>('/contacts', { params }),
  
  get: (id: number) => 
    api.get<Contact>(`/contacts/${id}`),
  
  create: (data: ContactForm) => 
    api.post('/contacts', data),
  
  update: (id: number, data: ContactForm) => 
    api.put(`/contacts/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/contacts/${id}`),
};

// Types for the API
export interface Email {
  id: number;
  subject: string;
  body: string;
  to: string;
  from: string;
  read: boolean;
  trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailForm {
  to: string;
  subject: string;
  body: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ContactForm {
  name: string;
  email: string;
}

export default api;