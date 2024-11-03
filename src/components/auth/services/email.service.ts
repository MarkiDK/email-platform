import { emails, Email, EmailForm, PaginatedResponse } from '@/lib/api';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface EmailState {
  emails: Email[];
  currentEmail: Email | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  filters: {
    search: string;
    folder: 'inbox' | 'sent' | 'trash';
  };
  
  // Actions
  fetchEmails: () => Promise<void>;
  fetchEmail: (id: number) => Promise<void>;
  sendEmail: (data: EmailForm) => Promise<void>;
  deleteEmail: (id: number) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAsUnread: (id: number) => Promise<void>;
  moveToTrash: (id: number) => Promise<void>;
  restoreEmail: (id: number) => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFolder: (folder: 'inbox' | 'sent' | 'trash') => void;
  clearError: () => void;
}

export const useEmails = create<EmailState>((set, get) => ({
  emails: [],
  currentEmail: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0
  },
  filters: {
    search: '',
    folder: 'inbox'
  },

  fetchEmails: async () => {
    try {
      set({ isLoading: true, error: null });
      const { currentPage } = get().pagination;
      const { search, folder } = get().filters;
      
      const response = await emails.getAll({ 
        page: currentPage,
        search,
        folder
      });
      
      const { data, meta } = response.data as PaginatedResponse<Email>;
      
      set({ 
        emails: data,
        pagination: {
          currentPage: meta.current_page,
          totalPages: meta.last_page,
          total: meta.total
        },
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af emails',
        isLoading: false 
      });
    }
  },

  fetchEmail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await emails.get(id);
      set({ currentEmail: response.data, isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af email',
        isLoading: false 
      });
    }
  },

  sendEmail: async (data: EmailForm) => {
    try {
      set({ isLoading: true, error: null });
      await emails.send(data);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved afsendelse af email',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteEmail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.delete(id);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved sletning af email',
        isLoading: false 
      });
    }
  },

  markAsRead: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.markAsRead(id);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved markering som læst',
        isLoading: false 
      });
    }
  },

  markAsUnread: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.markAsUnread(id);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved markering som ulæst',
        isLoading: false 
      });
    }
  },

  moveToTrash: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.moveToTrash(id);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved flytning til papirkurv',
        isLoading: false 
      });
    }
  },

  restoreEmail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.restore(id);
      await get().fetchEmails();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved gendannelse af email',
        isLoading: false 
      });
    }
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: {
        ...state.pagination,
        currentPage: page
      }
    }));
    get().fetchEmails();
  },

  setSearch: (search: string) => {
    set(state => ({
      filters: {
        ...state.filters,
        search
      },
      pagination: {
        ...state.pagination,
        currentPage: 1
      }
    }));
    get().fetchEmails();
  },

  setFolder: (folder: 'inbox' | 'sent' | 'trash') => {
    set(state => ({
      filters: {
        ...state.filters,
        folder
      },
      pagination: {
        ...state.pagination,
        currentPage: 1
      }
    }));
    get().fetchEmails();
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useEmails;