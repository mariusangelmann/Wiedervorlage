export interface Reminder {
  originalFrom: string;
  subject: string;
  reminderTime: string;
  body: string;
  references: string;
  timeUnit: string;
  timeAmount: number;
  createdAt: string;
  html?: string;
}

export interface EmailConfig {
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password?: string;
  baseDomain: string;
  // OAuth2 configuration
  authMethod?: 'password' | 'oauth2';
  oauth2?: OAuth2Config;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  accessUrl?: string;
  // Provider-specific settings
  provider?: 'google' | 'microsoft' | 'yahoo' | 'custom';
}

export interface HeartbeatConfig {
  enabled: boolean;
  url?: string;
  interval?: number;
}

export interface Settings {
  checkInterval: number;
  debugMode: boolean;
  maxRetries: number;
  remindersFile: string;
  processedFile: string;
  language: string;
  customTranslationsPath?: string;
  heartbeat?: HeartbeatConfig;
  searchDaysBack?: number; // Number of days to look back for emails (default: 7)
  deleteProcessedEmails?: boolean; // Move processed reminder emails to trash (default: true)
}

export interface TimePattern {
  name: string;
  pattern: RegExp;
  text: string;
}

export type TimePatterns = {
  [key: string]: TimePattern;
}

export interface CustomTranslations {
  language: string;
  translations: {
    [key: string]: any;
  };
}
