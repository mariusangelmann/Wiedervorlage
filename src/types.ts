export interface Reminder {
  originalFrom: string;
  subject: string;
  reminderTime: string;
  body: string;
  references: string;
  timeUnit: string;
  timeAmount: number;
  createdAt: string;
}

export interface EmailConfig {
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  baseDomain: string;
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
  language: string;
  customTranslationsPath?: string;
  heartbeat?: HeartbeatConfig;
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
