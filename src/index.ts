import { config } from 'dotenv';
import { EmailReminderService } from './EmailReminderService';
import { EmailConfig, Settings } from './types';
import { promises as fs } from 'fs';

// Load environment variables
config();

// Email configuration
const emailConfig: EmailConfig = {
  imapServer: process.env.IMAP_SERVER || '',
  imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
  smtpServer: process.env.SMTP_SERVER || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  username: process.env.EMAIL_USERNAME || '',
  password: process.env.EMAIL_PASSWORD,
  baseDomain: process.env.BASE_DOMAIN || '',
  authMethod: process.env.AUTH_METHOD as 'password' | 'oauth2' || 'password',
};

// Add OAuth2 configuration if using OAuth2
if (process.env.AUTH_METHOD === 'oauth2') {
  emailConfig.oauth2 = {
    clientId: process.env.OAUTH2_CLIENT_ID || '',
    clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
    refreshToken: process.env.OAUTH2_REFRESH_TOKEN || '',
    accessToken: process.env.OAUTH2_ACCESS_TOKEN,
    accessUrl: process.env.OAUTH2_ACCESS_URL,
    provider: process.env.OAUTH2_PROVIDER as 'google' | 'microsoft' | 'yahoo' | 'custom'
  };
}

// Service settings
const settings: Settings = {
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60', 10),
  debugMode: process.env.DEBUG_MODE === 'true',
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  remindersFile: process.env.REMINDERS_FILE || 'reminders.json',
  language: process.env.LANGUAGE || 'en',
  customTranslationsPath: process.env.CUSTOM_TRANSLATIONS_PATH,
  heartbeat: {
    enabled: process.env.HEARTBEAT_ENABLED === 'true',
    url: process.env.HEARTBEAT_URL,
    interval: process.env.HEARTBEAT_INTERVAL 
      ? parseInt(process.env.HEARTBEAT_INTERVAL, 10)
      : undefined
  }
};

// Validate configuration
const requiredEnvVars = [
  'IMAP_SERVER',
  'SMTP_SERVER',
  'EMAIL_USERNAME',
  'BASE_DOMAIN'
];

// Add auth-specific requirements
if (process.env.AUTH_METHOD === 'oauth2') {
  requiredEnvVars.push(
    'OAUTH2_CLIENT_ID',
    'OAUTH2_CLIENT_SECRET',
    'OAUTH2_REFRESH_TOKEN'
  );
} else {
  requiredEnvVars.push('EMAIL_PASSWORD');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error(`Auth method: ${process.env.AUTH_METHOD || 'password'}`);
  process.exit(1);
}

// Initialize reminders file if it doesn't exist
async function initRemindersFile() {
  try {
    await fs.access(settings.remindersFile);
  } catch {
    await fs.writeFile(settings.remindersFile, '[]');
  }
}

// Keep track of whether we're shutting down
let isShuttingDown = false;

// Start the service
async function main() {
  try {
    console.log('Setting up process handlers...');
    
    // Set up error handlers first
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      if (!isShuttingDown) {
        process.exit(1);
      }
    });

    // Log environment configuration
    console.log('Environment configuration:');
    console.log('- IMAP Server:', emailConfig.imapServer);
    console.log('- SMTP Server:', emailConfig.smtpServer);
    console.log('- Check Interval:', settings.checkInterval);
    console.log('- Debug Mode:', settings.debugMode);
    console.log('- Language:', settings.language);

    console.log('Initializing reminders file...');
    await initRemindersFile();
    
    console.log('Creating email reminder service...');
    const service = new EmailReminderService(emailConfig, settings);
    
    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      await service.stop();
      
      console.log('Shutdown complete');
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    console.log('Starting service...');
    await service.start();
  } catch (error) {
    console.error('Fatal error in main:', error);
    // Print the full error stack
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Start the application
console.log('Starting application...');
main().catch(error => {
  console.error('Fatal error:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  // Give time for error logs to be written
  setTimeout(() => process.exit(1), 1000);
});
