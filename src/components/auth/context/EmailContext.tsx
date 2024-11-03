import React, { createContext, useContext, useState, useEffect } from 'react';
import { Email, EmailFolder, EmailLabel, EmailDraft, EmailFilter } from '@/types/email.types';
import { useAuth } from './AuthContext';

interface EmailContextType {
  emails: Email[];
  folders: EmailFolder[];
  labels: EmailLabel[];
  drafts: EmailDraft[];
  filters: EmailFilter[];
  selectedEmails: string[];
  currentFolder: string;
  isLoading: boolean;
  error: string | null;
  
  // Email operations
  fetchEmails: (folderId: string) => Promise<void>;
  sendEmail: (email: Partial<Email>) => Promise<void>;
  deleteEmails: (emailIds: string[]) => Promise<void>;
  markAsRead: (emailIds: string[], read: boolean) => Promise<void>;
  moveToFolder: (emailIds: string[], folderId: string) => Promise<void>;
  toggleStar: (emailId: string) => Promise<void>;
  applyLabel: (emailIds: string[], labelId: string) => Promise<void>;
  removeLabel: (emailIds: string[], labelId: string) => Promise<void>;
  
  // Draft operations
  saveDraft: (draft: Partial<EmailDraft>) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  
  // Folder operations
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  
  // Label operations
  createLabel: (name: string, color: string) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  
  // Filter operations
  createFilter: (filter: Partial<EmailFilter>) => Promise<void>;
  updateFilter: (filterId: string, filter: Partial<EmailFilter>) => Promise<void>;
  deleteFilter: (filterId: string) => Promise<void>;
  
  // Selection operations
  setSelectedEmails: (emailIds: string[]) => void;
  clearSelection: () => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [filters, setFilters] = useState<EmailFilter[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('inbox');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeEmailData();
    }
  }, [user]);

  const initializeEmailData = async () => {
    try {
      await Promise.all([
        fetchFolders(),
        fetchLabels(),
        fetchFilters(),
        fetchDrafts()
      ]);
      await fetchEmails('inbox');
    } catch (err) {
      console.error('Failed to initialize email data:', err);
      setError('Failed to load email data');
    }
  };

  const fetchEmails = async (folderId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/emails/folder/${folderId}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(data);
      setCurrentFolder(folderId);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (email: Partial<Email>) => {
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email),
      });
      if (!response.ok) throw new Error('Failed to send email');
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email');
      throw err;
    }
  };

  const deleteEmails = async (emailIds: string[]) => {
    try {
      const response = await fetch('/api/emails/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds }),
      });
      if (!response.ok) throw new Error('Failed to delete emails');
      setEmails(emails.filter(email => !emailIds.includes(email.id)));
      clearSelection();
    } catch (err) {
      console.error('Error deleting emails:', err);
      setError('Failed to delete emails');
      throw err;
    }
  };

  const markAsRead = async (emailIds: string[], read: boolean) => {
    try {
      const response = await fetch('/api/emails/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds, read }),
      });
      if (!response.ok) throw new Error('Failed to mark emails');
      setEmails(emails.map(email => 
        emailIds.includes(email.id) ? { ...email, read } : email
      ));
    } catch (err) {
      console.error('Error marking emails:', err);
      setError('Failed to update email status');
      throw err;
    }
  };

  const moveToFolder = async (emailIds: string[], folderId: string) => {
    try {
      const response = await fetch('/api/emails/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds, folderId }),
      });
      if (!response.ok) throw new Error('Failed to move emails');
      if (currentFolder !== folderId) {
        setEmails(emails.filter(email => !emailIds.includes(email.id)));
      }
      clearSelection();
    } catch (err) {
      console.error('Error moving emails:', err);
      setError('Failed to move emails');
      throw err;
    }
  };

  const toggleStar = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      
      const response = await fetch(`/api/emails/${emailId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !email.starred }),
      });
      if (!response.ok) throw new Error('Failed to toggle star');
      
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, starred: !e.starred } : e
      ));
    } catch (err) {
      console.error('Error toggling star:', err);
      setError('Failed to update star status');
      throw err;
    }
  };

  const applyLabel = async (emailIds: string[], labelId: string) => {
    try {
      const response = await fetch('/api/emails/apply-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds, labelId }),
      });
      if (!response.ok) throw new Error('Failed to apply label');
      
      setEmails(emails.map(email => {
        if (emailIds.includes(email.id)) {
          const newLabels = [...(email.labels || [])];
          if (!newLabels.includes(labelId)) {
            newLabels.push(labelId);
          }
          return { ...email, labels: newLabels };
        }
        return email;
      }));
    } catch (err) {
      console.error('Error applying label:', err);
      setError('Failed to apply label');
      throw err;
    }
  };

  const removeLabel = async (emailIds: string[], labelId: string) => {
    try {
      const response = await fetch('/api/emails/remove-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds, labelId }),
      });
      if (!response.ok) throw new Error('Failed to remove label');
      
      setEmails(emails.map(email => {
        if (emailIds.includes(email.id)) {
          return {
            ...email,
            labels: (email.labels || []).filter(id => id !== labelId)
          };
        }
        return email;
      }));
    } catch (err) {
      console.error('Error removing label:', err);
      setError('Failed to remove label');
      throw err;
    }
  };

  // Draft operations
  const saveDraft = async (draft: Partial<EmailDraft>) => {
    try {
      const response = await fetch('/api/drafts', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error('Failed to save draft');
      const savedDraft = await response.json();
      setDrafts(draft.id 
        ? drafts.map(d => d.id === draft.id ? savedDraft : d)
        : [...drafts, savedDraft]
      );
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft');
      throw err;
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete draft');
      setDrafts(drafts.filter(draft => draft.id !== draftId));
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError('Failed to delete draft');
      throw err;
    }
  };

  // Folder operations
  const createFolder = async (name: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      const newFolder = await response.json();
      setFolders([...folders, newFolder]);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      throw err;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      setFolders(folders.filter(folder => folder.id !== folderId));
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder');
      throw err;
    }
  };

  // Label operations
  const createLabel = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) throw new Error('Failed to create label');
      const newLabel = await response.json();
      setLabels([...labels, newLabel]);
    } catch (err) {
      console.error('Error creating label:', err);
      setError('Failed to create label');
      throw err;
    }
  };

  const deleteLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete label');
      setLabels(labels.filter(label => label.id !== labelId));
    } catch (err) {
      console.error('Error deleting label:', err);
      setError('Failed to delete label');
      throw err;
    }
  };

  // Filter operations
  const createFilter = async (filter: Partial<EmailFilter>) => {
    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
      });
      if (!response.ok) throw new Error('Failed to create filter');
      const newFilter = await response.json();
      setFilters([...filters, newFilter]);
    } catch (err) {
      console.error('Error creating filter:', err);
      setError('Failed to create filter');
      throw err;
    }
  };

  const updateFilter = async (filterId: string, filter: Partial<EmailFilter>) => {
    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
      });
      if (!response.ok) throw new Error('Failed to update filter');
      const updatedFilter = await response.json();
      setFilters(filters.map(f => f.id === filterId ? updatedFilter : f));
    } catch (err) {
      console.error('Error updating filter:', err);
      setError('Failed to update filter');
      throw err;
    }
  };

  const deleteFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete filter');
      setFilters(filters.filter(filter => filter.id !== filterId));
    } catch (err) {
      console.error('Error deleting filter:', err);
      setError('Failed to delete filter');
      throw err;
    }
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  const value = {
    emails,
    folders,
    labels,
    drafts,
    filters,
    selectedEmails,
    currentFolder,
    isLoading,
    error,
    fetchEmails,
    sendEmail,
    deleteEmails,
    markAsRead,
    moveToFolder,
    toggleStar,
    applyLabel,
    removeLabel,
    saveDraft,
    deleteDraft,
    createFolder,
    deleteFolder,
    createLabel,
    deleteLabel,
    createFilter,
    updateFilter,
    deleteFilter,
    setSelectedEmails,
    clearSelection,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail