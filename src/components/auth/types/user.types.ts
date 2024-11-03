export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    settings: UserSettings;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    preferences: UserPreferences;
    metadata?: Record<string, any>;
  }
  
  export type UserRole = 
    | 'admin'
    | 'user'
    | 'guest';
  
  export type UserStatus = 
    | 'active'
    | 'inactive'
    | 'suspended'
    | 'pending';
  
  export interface UserSettings {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    theme: ThemeSettings;
  }
  
  export interface NotificationSettings {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    emailDigest: 'never' | 'daily' | 'weekly';
    notifyOn: {
      newEmail: boolean;
      mentions: boolean;
      replies: boolean;
      updates: boolean;
    };
  }
  
  export interface PrivacySettings {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showReadReceipts: boolean;
    allowSearchByEmail: boolean;
    allowContactRequests: boolean;
  }
  
  export interface ThemeSettings {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  }
  
  export interface UserPreferences {
    sidebar: {
      collapsed: boolean;
      favorites: string[];
      hiddenSections: string[];
    };
    emailDisplay: {
      defaultView: 'list' | 'grid';
      threaded: boolean;
      previewPane: boolean;
      sortOrder: 'asc' | 'desc';
      sortBy: 'date' | 'subject' | 'from';
    };
    shortcuts: Record<string, string>;
    customization: {
      quickActions: string[];
      dashboardWidgets: string[];
    };
  }
  
  export interface UserProfile extends Pick<User, 'id' | 'name' | 'email' | 'avatar'> {
    bio?: string;
    phone?: string;
    location?: string;
    company?: string;
    position?: string;
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  }
  
  export interface UserSession {
    id: string;
    userId: string;
    deviceInfo: {
      type: string;
      browser: string;
      os: string;
      ip: string;
    };
    createdAt: string;
    expiresAt: string;
    lastActivityAt: string;
  }
  
  export interface UserActivity {
    id: string;
    userId: string;
    type: ActivityType;
    description: string;
    metadata?: Record<string, any>;
    timestamp: string;
  }
  
  export type ActivityType = 
    | 'login'
    | 'logout'
    | 'settings_change'
    | 'profile_update'
    | 'password_change'
    | 'email_sent'
    | 'email_received';
  
  export interface UserStats {
    emailsSent: number;
    emailsReceived: number;
    attachmentsSent: number;
    storageUsed: number;
    lastActive: string;
    loginCount: number;
    averageResponseTime: number;
  }
  
  export interface UserError {
    code: string;
    message: string;
    field?: string;
    details?: any;
  }
  
  export interface UserAuthToken {
    token: string;
    type: 'access' | 'refresh';
    expiresAt: string;
  }
  
  export interface UserRegistration {
    email: string;
    password: string;
    name: string;
    acceptedTerms: boolean;
    inviteCode?: string;
  }
  
  export interface UserPasswordReset {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }