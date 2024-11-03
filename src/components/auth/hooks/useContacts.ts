import { contacts, Contact, ContactForm, PaginatedResponse } from '@/lib/api';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface ContactsState {
  contacts: Contact[];
  selectedContact: Contact | null;
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
    sortBy: 'name' | 'email' | 'created_at';
    sortOrder: 'asc' | 'desc';
  };
  
  // Actions
  fetchContacts: () => Promise<void>;
  fetchContact: (id: number) => Promise<void>;
  createContact: (data: ContactForm) => Promise<void>;
  updateContact: (id: number, data: ContactForm) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setSorting: (sortBy: 'name' | 'email' | 'created_at', sortOrder: 'asc' | 'desc') => void;
  selectContact: (contact: Contact | null) => void;
  clearError: () => void;
}

export const useContacts = create<ContactsState>((set, get) => ({
  contacts: [],
  selectedContact: null,
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
    sortBy: 'name',
    sortOrder: 'asc'
  },

  fetchContacts: async () => {
    try {
      set({ isLoading: true, error: null });
      const { currentPage } = get().pagination;
      const { search, sortBy, sortOrder } = get().filters;
      
      const response = await contacts.getAll({ 
        page: currentPage,
        search,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      const { data, meta } = response.data as PaginatedResponse<Contact>;
      
      set({ 
        contacts: data,
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
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af kontakter',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchContact: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await contacts.get(id);
      set({ 
        selectedContact: response.data,
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved hentning af kontakt',
        isLoading: false 
      });
      throw error;
    }
  },

  createContact: async (data: ContactForm) => {
    try {
      set({ isLoading: true, error: null });
      await contacts.create(data);
      set({ isLoading: false });
      await get().fetchContacts();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved oprettelse af kontakt',
        isLoading: false 
      });
      throw error;
    }
  },

  updateContact: async (id: number, data: ContactForm) => {
    try {
      set({ isLoading: true, error: null });
      await contacts.update(id, data);
      set({ isLoading: false });
      await get().fetchContacts();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved opdatering af kontakt',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteContact: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await contacts.delete(id);
      set({ isLoading: false });
      await get().fetchContacts();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved sletning af kontakt',
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

  setSorting: (sortBy: 'name' | 'email' | 'created_at', sortOrder: 'asc' | 'desc') => {
    set(state => ({
      filters: {
        ...state.filters,
        sortBy,
        sortOrder
      }
    }));
  },

  selectContact: (contact: Contact | null) => {
    set({ selectedContact: contact });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useContacts;