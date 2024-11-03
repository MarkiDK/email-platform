export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string[];
    phone?: string[];
    company?: string;
    jobTitle?: string;
    avatar?: string;
    notes?: string;
    tags?: string[];
    groups?: string[];
    favorite: boolean;
    lastContacted?: string;
    createdAt: string;
    updatedAt: string;
    addresses?: Address[];
    socialProfiles?: SocialProfile[];
    customFields?: CustomField[];
    metadata?: Record<string, any>;
  }
  
  export interface Address {
    type: AddressType;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isPrimary?: boolean;
  }
  
  export type AddressType = 
    | 'home'
    | 'work'
    | 'other';
  
  export interface SocialProfile {
    platform: SocialPlatform;
    username: string;
    url: string;
  }
  
  export type SocialPlatform = 
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'github'
    | 'other';
  
  export interface CustomField {
    id: string;
    label: string;
    value: string;
    type: CustomFieldType;
  }
  
  export type CustomFieldType = 
    | 'text'
    | 'number'
    | 'date'
    | 'url'
    | 'select';
  
  export interface ContactGroup {
    id: string;
    name: string;
    description?: string;
    color?: string;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ContactTag {
    id: string;
    name: string;
    color: string;
    contactCount: number;
  }
  
  export interface ContactImport {
    source: 'csv' | 'vcard' | 'google' | 'outlook';
    data: any;
    mapping: Record<string, string>;
    options?: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      importGroups?: boolean;
    };
  }
  
  export interface ContactExport {
    format: 'csv' | 'vcard' | 'json';
    contacts: string[]; // contact IDs
    options?: {
      includeNotes?: boolean;
      includeGroups?: boolean;
      includeTags?: boolean;
      includeCustomFields?: boolean;
    };
  }
  
  export interface ContactSearch {
    query: string;
    filters?: {
      groups?: string[];
      tags?: string[];
      company?: string;
      lastContacted?: {
        from?: string;
        to?: string;
      };
    };
    sort?: {
      field: ContactSortField;
      order: 'asc' | 'desc';
    };
    pagination?: {
      page: number;
      limit: number;
    };
  }
  
  export type ContactSortField = 
    | 'name'
    | 'email'
    | 'company'
    | 'lastContacted'
    | 'createdAt';
  
  export interface ContactStats {
    total: number;
    favorites: number;
    withEmail: number;
    withPhone: number;
    byGroup: Record<string, number>;
    byTag: Record<string, number>;
    recentlyContacted: number;
  }
  
  export interface ContactMerge {
    primary: string; // Primary contact ID
    secondary: string[]; // Secondary contact IDs to merge
    fieldPreferences?: {
      [key: string]: 'primary' | 'secondary' | 'combine';
    };
  }
  
  export interface ContactError {
    code: string;
    message: string;
    field?: string;
    details?: any;
  }
  
  export interface ContactActivity {
    id: string;
    contactId: string;
    type: ContactActivityType;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }
  
  export type ContactActivityType = 
    | 'email_sent'
    | 'email_received'
    | 'note_added'
    | 'field_updated'
    | 'group_added'
    | 'group_removed'
    | 'tag_added'
    | 'tag_removed';
  
  export interface ContactDuplicate {
    id: string;
    contacts: string[]; // Array of contact IDs that might be duplicates
    matchScore: number;
    matchFields: string[];
  }
  
  export interface ContactValidation {
    email?: {
      isValid: boolean;
      message?: string;
    };
    phone?: {
      isValid: boolean;
      message?: string;
    };
  }