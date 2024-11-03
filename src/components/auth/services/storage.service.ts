import { storage } from '@/lib/api';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface StorageState {
  files: File[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  
  // Actions
  uploadFile: (file: File) => Promise<string>;
  deleteFile: (filename: string) => Promise<void>;
  clearError: () => void;
}

export const useStorage = create<StorageState>((set) => ({
  files: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,

  uploadFile: async (file: File) => {
    try {
      set({ isLoading: true, error: null });
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await storage.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          set({ uploadProgress: progress });
        },
      });

      set({ 
        isLoading: false,
        uploadProgress: 0
      });

      return response.data.url;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved upload af fil',
        isLoading: false,
        uploadProgress: 0
      });
      throw error;
    }
  },

  deleteFile: async (filename: string) => {
    try {
      set({ isLoading: true, error: null });
      await storage.delete(filename);
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      set({ 
        error: axiosError.response?.data.message || 'Der skete en fejl ved sletning af fil',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useStorage;