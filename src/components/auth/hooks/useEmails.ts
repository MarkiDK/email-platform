import { emails, Email, EmailForm, PaginatedResponse } from '@/lib/api';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface EmailsState {
  emails: Email[];
  currentEmail: Email | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    perPage: number;
  };
  filters: {
    search: string;
    folder: 'inbox' | 'sent' | 'trash';
    sortBy: 'created_at' | 'subject';
    sortOrder: 'asc' | 'desc';
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
  setSorting: (sortBy: 'created_at' | 'subject', sortOrder: 'asc' | 'desc') => void;
  clearError: () => void;
}

export const useEmails = create<EmailsState>((set, get) => ({
  emails: [],
  currentEmail: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 20
  },
  filters: {
    search: '',
    folder: 'inbox',
    sortBy: 'created_at',
    sortOrder: 'desc'
  },

  fetchEmails: async () => {
    try {
      set({ isLoading: true, error: null });
      const { currentPage } = get().pagination;
      const { search, folder, sortBy, sortOrder } = get().filters;
      
      const response = await emails.getAll({ 
        page: currentPage,
        search,
        folder,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      const { data, meta } = response.data as PaginatedResponse<Email>;
      
      set({ 
        emails: data,
        pagination: {
          currentPage: meta.current_page,
          totalPages: meta.last_page,
          total: meta.total,
          perPage: meta.per_page
        },
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af emails',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchEmail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await emails.get(id);
      set({ 
        currentEmail: response.data,
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af email',
        isLoading: false 
      });
      throw error;
    }
  },

  sendEmail: async (data: EmailForm) => {
    try {
      set({ isLoading: true, error: null });
      await emails.send(data);
      set({ isLoading: false });
      await get().fetchEmails();
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
      set({ isLoading: false });
      await get().fetchEmails();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved sletning af email',
        isLoading: false 
      });
      throw error;
    }
  },

  markAsRead: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.markAsRead(id);
      set({ isLoading: false });
      await get().fetchEmails();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved markering af email som læst',
        isLoading: false 
      });
      throw error;
    }
  },

  markAsUnread: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.markAsUnread(id);
      set({ isLoading: false });
      await get().fetchEmails();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved markering af email som ulæst',
        isLoading: false 
      });
      throw error;
    }
  },

  moveToTrash: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.moveToTrash(id);
      set({ isLoading: false });
      await get().fetchEmails();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved flytning af email til papirkurv',
        isLoading: false 
      });
      throw error;
    }
  },

  restoreEmail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await emails.restore(id);
      set({ isLoading: false });
      await get().fetchEmails();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved gendannelse af email',
        isLoading: false 
      });
      throw error;
    }
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: {
        ...state.pagination,
        currentPage: page
      }
    }));
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
  },

  setSorting: (sortBy: 'created_at' | 'subject', sortOrder: 'asc' | 'desc') => {
    set(state => ({
      filters: {
        ...state.filters,
        sortBy,
        sortOrder
      }
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useEmails;