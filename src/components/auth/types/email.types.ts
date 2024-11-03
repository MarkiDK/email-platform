export interface Attachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    url: string;
  }
  
  export interface EmailAddress {
    name?: string;
    address: string;
  }
  
  export interface Email {
    id: string;
    conversationId: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Attachment[];
    date: string;
    read: boolean;
    starred: boolean;
    labels?: string[];
    folder: string;
    replyTo?: EmailAddress[];
    inReplyTo?: string;
    references?: string[];
  }
  
  export interface EmailFolder {
    id: string;
    name: string;
    icon?: string;
    count?: number;
    type: 'system' | 'custom';
    color?: string;
  }
  
  export interface EmailLabel {
    id: string;
    name: string;
    color: string;
  }
  
  export interface EmailFilter {
    id: string;
    name: string;
    conditions: EmailFilterCondition[];
    actions: EmailFilterAction[];
    enabled: boolean;
  }
  
  export interface EmailFilterCondition {
    field: 'from' | 'to' | 'subject' | 'body' | 'hasAttachment';
    operator: 'contains' | 'notContains' | 'equals' | 'notEquals' | 'matches';
    value: string;
  }
  
  export interface EmailFilterAction {
    type: 'move' | 'label' | 'star' | 'markRead' | 'delete';
    value: string;
  }
  
  export interface EmailDraft {
    id: string;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Attachment[];
    savedAt: string;
    inReplyTo?: string;
    references?: string[];
  }
  
  export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    content: string;
    variables: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface EmailSignature {
    id: string;
    name: string;
    content: string;
    isDefault: boolean;
  }
  
  export interface EmailAccount {
    id: string;
    email: string;
    name: string;
    provider: string;
    isDefault: boolean;
    folders: EmailFolder[];
    labels: EmailLabel[];
    signatures: EmailSignature[];
  }
  
  export interface EmailSearchResult {
    id: string;
    type: 'email' | 'attachment' | 'contact';
    title: string;
    preview: string;
    date: string;
    matchedFields: string[];
  }
  
  export interface EmailStats {
    total: number;
    unread: number;
    starred: number;
    withAttachments: number;
    byFolder: Record<string, number>;
    byLabel: Record<string, number>;
  }
  
  export interface EmailError {
    code: string;
    message: string;
    details?: any;
  }
  
  export type EmailSortOption = 
    | 'date-desc'
    | 'date-asc'
    | 'subject-asc'
    | 'subject-desc'
    | 'from-asc'
    | 'from-desc';
  
  export type EmailViewMode = 
    | 'list'
    | 'compact'
    | 'preview';
  
  export interface EmailSettings {
    defaultAccount: string;
    signaturePosition: 'above' | 'below';
    defaultView: EmailViewMode;
    defaultSort: EmailSortOption;
    showNotifications: boolean;
    autoMarkAsRead: boolean;
    threadingEnabled: boolean;
    darkMode: boolean;
  }