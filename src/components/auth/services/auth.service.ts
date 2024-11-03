import { auth } from '@/lib/api';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { 
    name: string; 
    email: string; 
    password: string; 
    password_confirmation: string 
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await auth.login(email, password);
      localStorage.setItem('token', response.data.token);
      set({ 
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved login',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await auth.register(data);
      localStorage.setItem('token', response.data.token);
      set({ 
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved registrering',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await auth.logout();
      localStorage.removeItem('token');
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved logout',
        isLoading: false 
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await auth.me();
      set({ 
        user: response.data,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuth;