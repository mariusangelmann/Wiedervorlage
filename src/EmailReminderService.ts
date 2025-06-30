import * as nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { promises as fs } from 'fs';
import { EmailConfig, Reminder, Settings } from './types';
import { TIME_PATTERNS, cleanSubject, formatTimeString, delay } from './utils';
import { TranslationService } from './translations';
import { HeartbeatService } from './HeartbeatService';
import * as Mailparser from 'mailparser';

export class EmailReminderService {
  private transporter: nodemailer.Transporter;
  private imapConfig: any;
  private emailConfig: EmailConfig;
  private settings: Settings;
  private translator: TranslationService;
  private heartbeatService?: HeartbeatService;
  private isRunning: boolean = false;
  private currentConnection: any = null;
  private processedMessageIds: Set<string> = new Set();

  constructor(emailConfig: EmailConfig, settings: Settings) {
    console.log('Initializing EmailReminderService...');
    
    console.log('Creating TranslationService...');
    this.translator = new TranslationService(settings.language, settings.customTranslationsPath);
    this.emailConfig = emailConfig;
    this.settings = settings;

    // Initialize heartbeat service if enabled
    if (settings.heartbeat?.enabled && settings.heartbeat.url) {
      console.log('Initializing HeartbeatService...');
      this.heartbeatService = new HeartbeatService(settings.heartbeat);
    }

    console.log('Setting up SMTP transporter...');
    try {
      const smtpConfig: any = {
        host: emailConfig.smtpServer,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpPort === 465,
      };

      if (emailConfig.authMethod === 'oauth2' && emailConfig.oauth2) {
        console.log('Using OAuth2 authentication for SMTP');
        smtpConfig.auth = {
          type: 'OAuth2',
          user: emailConfig.username,
          clientId: emailConfig.oauth2.clientId,
          clientSecret: emailConfig.oauth2.clientSecret,
          refreshToken: emailConfig.oauth2.refreshToken,
          accessToken: emailConfig.oauth2.accessToken,
          accessUrl: emailConfig.oauth2.accessUrl,
        };
      } else {
        console.log('Using password authentication for SMTP');
        smtpConfig.auth = {
          user: emailConfig.username,
          pass: emailConfig.password,
        };
      }

      this.transporter = nodemailer.createTransport(smtpConfig);
      console.log('SMTP transporter created successfully');
    } catch (error) {
      console.error('Error creating SMTP transporter:', error);
      throw error;
    }

    console.log('Setting up IMAP config...');
    try {
      const imapAuth: any = {};
      
      if (this.emailConfig.authMethod === 'oauth2' && this.emailConfig.oauth2) {
        console.log('Using OAuth2 authentication for IMAP');
        // For OAuth2, we need to generate the XOAUTH2 string
        imapAuth.xoauth2 = this.generateXOAuth2String(
          this.emailConfig.username,
          this.emailConfig.oauth2.accessToken || this.emailConfig.oauth2.refreshToken
        );
      } else {
        console.log('Using password authentication for IMAP');
        imapAuth.user = this.emailConfig.username;
        imapAuth.password = this.emailConfig.password;
      }

      this.imapConfig = {
        imap: {
          ...imapAuth,
          host: this.emailConfig.imapServer,
          port: this.emailConfig.imapPort,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          debug: this.settings.debugMode ? console.log : undefined,
          connectionTimeout: 10000 // Increase timeout to 10 seconds
        }
      };
      console.log('IMAP config created successfully');
    } catch (error) {
      console.error('Error creating IMAP config:', error);
      throw error;
    }
    
    console.log('EmailReminderService initialized successfully');
  }

  private generateXOAuth2String(username: string, accessToken: string): string {
    const authString = [
      `user=${username}`,
      `auth=Bearer ${accessToken}`,
      '',
      ''
    ].join('\x01');
    
    return Buffer.from(authString).toString('base64');
  }

  private async parseReminderAddress(address: string): Promise<{ reminderTime: Date; unit: string; amount: number } | null> {
    // Extract just the local part (before @) and convert to lowercase
    const localPart = address.split('@')[0]?.toLowerCase() || '';
    
    if (this.settings.debugMode) {
      console.log('[DEBUG] Parsing reminder address:', {
        fullAddress: address,
        localPart,
        patterns: TIME_PATTERNS
      });
    }

    for (const [unit, pattern] of Object.entries(TIME_PATTERNS)) {
      const match = pattern.pattern.exec(localPart);
      if (this.settings.debugMode && match) {
        console.log('[DEBUG] Found matching pattern:', {
          unit,
          pattern: pattern.pattern,
          match: match[1]
        });
      }
      if (match) {
        const amount = parseInt(match[1], 10);
        const reminderTime = new Date();
        
        switch (unit) {
          case 's': reminderTime.setSeconds(reminderTime.getSeconds() + amount); break;
          case 'm': reminderTime.setMinutes(reminderTime.getMinutes() + amount); break;
          case 'h': reminderTime.setHours(reminderTime.getHours() + amount); break;
          case 'd': reminderTime.setDate(reminderTime.getDate() + amount); break;
          case 'w': reminderTime.setDate(reminderTime.getDate() + (amount * 7)); break;
        }

        return { reminderTime, unit, amount };
      }
    }
    return null;
  }

  private async saveReminder(reminder: Reminder): Promise<void> {
    let reminders: Reminder[] = [];
    try {
      const content = await fs.readFile(this.settings.remindersFile, 'utf-8');
      reminders = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
    }

    reminders.push(reminder);
    await fs.writeFile(this.settings.remindersFile, JSON.stringify(reminders, null, 2));
  }

  private async loadProcessedMessageIds(): Promise<void> {
    try {
      const content = await fs.readFile(this.settings.processedFile, 'utf-8');
      const ids = JSON.parse(content);
      this.processedMessageIds = new Set(ids);
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Loaded ${this.processedMessageIds.size} processed message IDs`);
      }
    } catch (error) {
      // File doesn't exist or is empty, start with empty set
      this.processedMessageIds = new Set();
    }
  }

  private async saveProcessedMessageId(messageId: string): Promise<void> {
    this.processedMessageIds.add(messageId);
    const ids = Array.from(this.processedMessageIds);
    await fs.writeFile(this.settings.processedFile, JSON.stringify(ids, null, 2));
  }

  private isMessageProcessed(messageId: string): boolean {
    return this.processedMessageIds.has(messageId);
  }

  private async sendConfirmation(to: string, reminderTime: Date): Promise<void> {
    try {
      const timeDiff = reminderTime.getTime() - new Date().getTime();
      const timeStr = formatTimeString(timeDiff, this.translator);

      const textBody = this.translator.translate('emails.confirmationBody', {
        timeStr,
        deliveryTime: reminderTime.toLocaleString(this.settings.language === 'de' ? 'de-DE' : 'en-US')
      });

      // Create a simple HTML version of the confirmation
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; border-left: 4px solid #4caf50;">
            <h2 style="color: #2e7d32; margin-top: 0;">✅ ${this.translator.translate('emails.confirmationSubject')}</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              ${textBody.replace(/\n/g, '<br>')}
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.emailConfig.username,
        to,
        subject: this.translator.translate('emails.confirmationSubject'),
        text: textBody,
        html: htmlBody
      });
    } catch (error: any) {
      console.error('\n❌ Failed to send confirmation email');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (error.code === 'EAUTH' || error.response?.includes('Authentication')) {
        console.error('SMTP Authentication failed. Check your email credentials.');
        if (this.emailConfig.smtpServer.includes('gmail')) {
          console.error('For Gmail, use an app password instead of your regular password.');
        }
      } else {
        console.error(`Error: ${error.message || error}`);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }

  private async sendReminder(reminder: Reminder): Promise<void> {
      const intervalText = `${reminder.timeAmount} ${this.translator.getTimeUnitText(reminder.timeUnit)}`;
      const createdTime = new Date(reminder.createdAt);

      const textBody = this.translator.translate('emails.reminderBody', {
        interval: intervalText,
        createdTime: createdTime.toLocaleString(this.settings.language === 'de' ? 'de-DE' : 'en-US'),
        separator: '='.repeat(50),
        body: reminder.body
      });

      // Create HTML body if the original email had HTML content
      let htmlBody: string | undefined;
      if (reminder.html) {
        // Extract the header part from the text body (everything before the separator)
        const textLines = textBody.split('\n');
        const separatorIndex = textLines.findIndex(line => line.includes('='.repeat(50)));
        const headerText = textLines.slice(0, separatorIndex).join('<br>');
        
        // Wrap the reminder information and original HTML content in a proper HTML structure
        htmlBody = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              ${headerText}
            </div>
            <hr style="border: 1px solid #ccc; margin: 20px 0;">
            <div style="padding: 10px;">
              ${reminder.html}
            </div>
          </div>
        `;
      }

      await this.transporter.sendMail({
        from: this.emailConfig.username,
        to: reminder.originalFrom,
        subject: this.translator.translate('emails.reminderSubject', { subject: reminder.subject }),
        text: textBody,
        html: htmlBody,
        references: reminder.references
      });
    }

  public async processReminders(): Promise<void> {
    if (this.settings.debugMode) {
      console.log('[DEBUG] Processing reminders');
      console.log(`[DEBUG] Reading reminders from: ${this.settings.remindersFile}`);
    }

    let reminders: Reminder[] = [];
    try {
      const content = await fs.readFile(this.settings.remindersFile, 'utf-8');
      reminders = JSON.parse(content);
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Loaded ${reminders.length} reminders`);
      }
    } catch (error) {
      await fs.writeFile(this.settings.remindersFile, '[]');
      if (this.settings.debugMode) {
        console.log('[DEBUG] Created new empty reminders file');
      }
      return;
    }

    const now = new Date();
    const remainingReminders = [];
    
    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.reminderTime);
      if (now >= reminderTime) {
        if (this.settings.debugMode) {
          console.log(`[DEBUG] Sending reminder: ${reminder.subject}`);
        }
        await this.sendReminder(reminder);
      } else {
        remainingReminders.push(reminder);
      }
    }

    await fs.writeFile(this.settings.remindersFile, JSON.stringify(remainingReminders, null, 2));
    if (this.settings.debugMode) {
      console.log(`[DEBUG] Updated reminders file. ${remainingReminders.length} reminders remaining`);
    }
  }

  public async checkMailbox(): Promise<void> {
    let connection: any | null = null;
    try {
      if (this.settings.debugMode) {
        console.log('[DEBUG] Starting mailbox check');
        console.log(`[DEBUG] Connecting to IMAP server: ${this.emailConfig.imapServer}:${this.emailConfig.imapPort}`);
      }

      const imapConfig = {
        imap: {
          user: this.emailConfig.username,
          password: this.emailConfig.password,
          host: this.emailConfig.imapServer,
          port: this.emailConfig.imapPort,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          debug: this.settings.debugMode ? console.log : undefined,
          connectionTimeout: 10000 // Increase timeout to 10 seconds
        }
      };

      const imapSimple = require('imap-simple');
      connection = await imapSimple.connect(imapConfig);
      this.currentConnection = connection;
      
      if (this.settings.debugMode) {
        console.log('[DEBUG] IMAP connection established successfully');
      }
      
      // Check if we're shutting down
      if (!this.isRunning) {
        console.log('Shutdown requested, aborting mailbox check');
        return;
      }
      
      if (this.settings.debugMode) {
        console.log('[DEBUG] Opening INBOX');
      }
      await connection.openBox('INBOX');
      if (this.settings.debugMode) {
        console.log('[DEBUG] INBOX opened successfully');
      }
      
      // Update heartbeat status on successful connection
      if (this.heartbeatService) {
        this.heartbeatService.setHealthStatus(true);
      }

      const fetchOptions = {
        bodies: [''],  // Empty string fetches the entire message
        markSeen: false,  // Don't mark as seen since we process all emails
        struct: true
      };

      if (this.settings.debugMode) {
        console.log('[DEBUG] Using fetch options:', JSON.stringify(fetchOptions, null, 2));
      }

      // Calculate date for search window
      const daysBack = this.settings.searchDaysBack || 7;
      const searchDate = new Date();
      searchDate.setDate(searchDate.getDate() - daysBack);
      const dateString = searchDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      if (this.settings.debugMode) {
        console.log('[DEBUG] IMAP fetch options:', fetchOptions);
        console.log(`[DEBUG] Searching for messages from the last ${daysBack} days (since ${dateString})`);
      }

      // Search for all messages from the configured time window (not just unread)
      const searchCriteria = [['SINCE', dateString]];
      const messages = await connection.search(searchCriteria, fetchOptions);
      
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Found ${messages.length} messages to check`);
      }

      for (const message of messages) {
        if (this.settings.debugMode) {
          console.log('[DEBUG] Processing message:', message.attributes?.uid);
        }

        // Get the entire message
        const allParts = message.parts.filter((p: any) => p.which === '');
        if (!allParts || allParts.length === 0) {
          console.log('[DEBUG] Missing message body');
          continue;
        }
        const fullMessage = allParts[0].body as string;

        // Use mailparser to parse the entire message
        const parsedMessage = await simpleParser(fullMessage);

        if (this.settings.debugMode) {
          console.log('[DEBUG] Parsed message:', parsedMessage);
        }

        const { to, cc, bcc, from, subject, messageId, text, html } = parsedMessage;

        // Check if we've already processed this message
        const msgId = Array.isArray(messageId) ? messageId[0] : messageId || '';
        if (msgId && this.isMessageProcessed(msgId)) {
          if (this.settings.debugMode) {
            console.log(`[DEBUG] Message ${msgId} already processed, skipping`);
          }
          continue;
        }

        // Helper function to convert header values to strings
        const headerToString = (value: string | string[]): string => {
          return Array.isArray(value) ? value.join(', ') : value;
        };
        
        // Helper function to convert AddressObject to string
        const addressToString = (addr: Mailparser.AddressObject | Mailparser.AddressObject[] | string | undefined): string => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (Array.isArray(addr)) {
            return addr.map(a => a.text || '').join(', ');
          }
          return addr.text || '';
        };
        
        // Manually extract header lines we need
        const headerLines = [
          { key: 'delivered-to', line: headerToString(parsedMessage.headerLines?.find(h => h.key === 'delivered-to')?.line || '') },
          { key: 'x-original-to', line: headerToString(parsedMessage.headerLines?.find(h => h.key === 'x-original-to')?.line || '') }
        ];
        
        // Parse headers while maintaining original structure
        const parsed = {
          to: to,
          cc: cc,
          bcc: bcc,
          from: from,
          subject: subject || '',
          messageId: messageId || '',
          text: text || '',
          html: html || '',
          headerLines
        };
        
        if (this.settings.debugMode) {
          console.log('[DEBUG] Parsed headers:', {
            to: parsed.to,
            cc: parsed.cc,
            bcc: parsed.bcc,
            from: addressToString(parsed.from),
            subject: parsed.subject,
            deliveredTo: parsed.headerLines.find(h => h.key === 'delivered-to')?.line,
            originalTo: parsed.headerLines.find(h => h.key === 'x-original-to')?.line
          });
        }

        // Convert header values to strings
        const toStr = addressToString(parsed.to);
        const ccStr = addressToString(parsed.cc);
        const bccStr = addressToString(parsed.bcc);

        // Get all possible recipient addresses
        const allRecipients = [
          // Regular recipients
          ...toStr.split(',').map((addr: string) => ({ text: addr.trim() })),
          ...ccStr.split(',').map((addr: string) => ({ text: addr.trim() })),
          ...bccStr.split(',').map((addr: string) => ({ text: addr.trim() })),
          // Additional headers that might contain the reminder address
          // Extract addresses from additional headers, handling potential multiple addresses
          ...parsed.headerLines
            .filter(h => ['delivered-to', 'x-original-to'].includes(h.key.toLowerCase()))
            .map(h => h.line)
            .flatMap(line => line.split(','))
            .map(addr => {
              // Remove header prefix (e.g., "Delivered-To: " or "X-Original-To: ")
              const cleanAddr = addr.replace(/^[^:]+:\s*/, '').trim();
              // Extract email address from possible "Name <email>" format
              const match = cleanAddr.match(/<([^>]+)>/);
              const email = match ? match[1] : cleanAddr;
              return { text: email };
            })
        ].filter(addr => addr.text && addr.text.includes('@')); // Remove empty and invalid addresses

        if (this.settings.debugMode) {
          console.log('[DEBUG] All recipients:', {
            rawHeaders: parsed.headerLines
              .filter(h => ['delivered-to', 'x-original-to'].includes(h.key.toLowerCase()))
              .map(h => h.line),
            parsedRecipients: allRecipients
          });
        }
        
        // Find the reminder address
        const reminderAddress = allRecipients.find(addr => {
          if (this.settings.debugMode) {
            console.log('[DEBUG] Checking address:', addr);
          }
          const address = addr?.text?.toLowerCase() || '';
          if (this.settings.debugMode) {
            const localPart = address.split('@')[0];
            const hasTimePattern = /\+\d+[smhdw]/.test(localPart);
            console.log('[DEBUG] Checking address format:', {
              address,
              hasBaseDomain: address.includes(this.emailConfig.baseDomain.toLowerCase()),
              hasTimePattern
            });
          }
          const domain = this.emailConfig.baseDomain.toLowerCase();
        // Check if it's for our domain and has a time pattern (e.g., +20s, +5m, +2h)
        const localPart = address.split('@')[0];
        const hasTimePattern = /\+\d+[smhdw]/.test(localPart);
        return address && 
               (address.endsWith(`@${domain}`) || address.endsWith(`@${domain}>`)) && 
               hasTimePattern;
        });
        
        if (this.settings.debugMode && reminderAddress) {
          console.log('[DEBUG] Found reminder address:', reminderAddress);
        }
        
        const reminderTo = reminderAddress?.text || '';

        if (this.settings.debugMode) {
          console.log('[DEBUG] Message details:', {
            to: reminderTo,
            from: addressToString(parsed.from),
            subject: parsed.subject
          });
        }

        if (reminderTo.includes(this.emailConfig.baseDomain)) {
          if (this.settings.debugMode) {
            console.log('[DEBUG] Found matching domain in recipient');
          }

          const reminderInfo = await this.parseReminderAddress(reminderTo);
          if (reminderInfo) {
            if (this.settings.debugMode) {
              console.log('[DEBUG] Valid reminder address found:', {
                time: reminderInfo.reminderTime,
                unit: reminderInfo.unit,
                amount: reminderInfo.amount
              });
            }

            // Convert from header to string
            const fromStr = addressToString(parsed.from);
            // Extract email address from possible "Name <email>" format
            const match = fromStr.match(/(?<=<)([^>]+)(?=>)|([^\s@]+@[^\s@]+\.[^\s@]+)/);
            const fromAddress = match ? (match[1] || match[2]) : fromStr.trim();
                
            const reminder: Reminder = {
              originalFrom: fromAddress,
              subject: cleanSubject(Array.isArray(parsed.subject) ? parsed.subject.join(' ') : parsed.subject || ''),
              reminderTime: reminderInfo.reminderTime.toISOString(),
              body: parsed.text || '',
              html: parsed.html || '',
              references: Array.isArray(parsed.messageId) ? parsed.messageId.join(', ') : parsed.messageId || '',
              timeUnit: reminderInfo.unit,
              timeAmount: reminderInfo.amount,
              createdAt: new Date().toISOString()
            };

            if (this.settings.debugMode) {
              console.log('[DEBUG] Created reminder:', reminder);
            }

            await this.saveReminder(reminder);
            await this.sendConfirmation(reminder.originalFrom, reminderInfo.reminderTime);
            
            // Mark this message as processed
            if (msgId) {
              await this.saveProcessedMessageId(msgId);
            }
            
            // Move the processed email to trash if configured
            if (this.settings.deleteProcessedEmails) {
              try {
                if (this.settings.debugMode) {
                  console.log('[DEBUG] Moving processed email to trash');
                }
                
                // Add Deleted flag to the message
                await connection.addFlags(message.attributes.uid, '\\Deleted');
                
                if (this.settings.debugMode) {
                  console.log('[DEBUG] Email marked for deletion');
                }
              } catch (deleteError) {
                console.error('Failed to move email to trash:', deleteError);
                // Continue processing even if deletion fails
              }
            }
            
            if (this.settings.debugMode) {
              console.log('[DEBUG] Reminder saved and confirmation sent');
            }
          } else if (this.settings.debugMode) {
            console.log('[DEBUG] No valid reminder pattern found in address');
          }
        } else if (this.settings.debugMode) {
          console.log('[DEBUG] Message not for reminder domain');
        }
      }
    } catch (error: any) {
      if (this.heartbeatService) {
        this.heartbeatService.setHealthStatus(false);
      }
      
      // Handle authentication errors specifically
      if (error.textCode === 'AUTHENTICATIONFAILED' || error.source === 'authentication') {
        console.error('\n❌ Authentication Failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (this.emailConfig.imapServer.includes('gmail.com')) {
          console.error('Gmail requires special authentication:');
          console.error('');
          console.error('Option 1: Use an App Password (Recommended for password auth)');
          console.error('  1. Enable 2-factor authentication on your Google account');
          console.error('  2. Generate an app password: https://myaccount.google.com/apppasswords');
          console.error('  3. Use the app password instead of your regular password');
          console.error('');
          console.error('Option 2: Use OAuth2 (Recommended for production)');
          console.error('  1. Set AUTH_METHOD=oauth2 in your .env file');
          console.error('  2. Follow the OAuth2 setup guide in the README');
          console.error('');
        } else if (this.emailConfig.imapServer.includes('outlook') || this.emailConfig.imapServer.includes('office365')) {
          console.error('Outlook/Office365 authentication tips:');
          console.error('  - If using 2FA, create an app password');
          console.error('  - Or use OAuth2 authentication (see README)');
          console.error('');
        }
        
        console.error('Current configuration:');
        console.error(`  - Email: ${this.emailConfig.username}`);
        console.error(`  - Server: ${this.emailConfig.imapServer}`);
        console.error(`  - Auth method: ${this.emailConfig.authMethod || 'password'}`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        if (this.settings.debugMode) {
          console.log('[DEBUG] Full error details:', error);
        }
      } else {
        // Generic error handling
        console.error('\n❌ Error checking mailbox');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Error: ${error.message || error}`);
        if (error.code) {
          console.error(`Code: ${error.code}`);
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        if (this.settings.debugMode) {
          console.error('[DEBUG] Full error stack:', error.stack || error);
        }
      }
    } finally {
      if (connection) {
        if (this.settings.debugMode) {
          console.log('[DEBUG] Closing IMAP connection');
        }
        try {
          // Expunge deleted messages before closing connection
          if (this.settings.deleteProcessedEmails) {
            try {
              await connection.imap.expunge();
              if (this.settings.debugMode) {
                console.log('[DEBUG] Expunged deleted messages');
              }
            } catch (expungeError) {
              console.error('Error expunging deleted messages:', expungeError);
            }
          }
          
          connection.end();
          if (this.currentConnection === connection) {
            this.currentConnection = null;
          }
        } catch (err) {
          console.error('Error closing IMAP connection:', err);
        }
      }
    }
  }

  public async start(): Promise<void> {
    await this.translator.loadTranslations();
    await this.loadProcessedMessageIds();
    
    console.log(this.translator.translate('console.serviceStart', { interval: this.settings.checkInterval }));
    console.log(this.translator.translate('console.debugMode', { enabled: this.settings.debugMode.toString() }));
    
    // Start heartbeat service if configured
    if (this.heartbeatService && this.settings.heartbeat?.url) {
      this.heartbeatService.start();
      console.log(this.translator.translate('console.heartbeatEnabled', { 
        url: this.settings.heartbeat.url,
        interval: this.settings.heartbeat.interval || this.settings.checkInterval
      }));
    }

    this.isRunning = true;
    while (this.isRunning) {
      try {
        if (this.settings.debugMode) {
          console.log('[DEBUG] Starting new check cycle');
        }
        await this.checkMailbox();
        await this.processReminders();
        
        // If we got here, both operations succeeded
        if (this.heartbeatService) {
          this.heartbeatService.setHealthStatus(true);
        }
        
        if (this.settings.debugMode) {
          console.log('[DEBUG] Check cycle complete, waiting', this.settings.checkInterval, 'seconds');
        }
        await delay(this.settings.checkInterval * 1000);
      } catch (error) {
        console.error('Error in main loop:', error);
        console.error(this.translator.translate('console.mainLoopError'), error);
        
        // Mark service as unhealthy on error
        if (this.heartbeatService) {
          this.heartbeatService.setHealthStatus(false);
        }
        
        console.log('Waiting 60 seconds before retry due to error...');
        await delay(60000); // Wait 1 minute on error
      }
    }
  }

  public async stop(): Promise<void> {
    console.log('Stopping EmailReminderService...');
    this.isRunning = false;
    
    if (this.heartbeatService) {
      this.heartbeatService.stop();
    }
    
    // Close IMAP connection if open
    if (this.currentConnection) {
      try {
        console.log('Closing IMAP connection...');
        await this.currentConnection.end();
        this.currentConnection = null;
      } catch (error) {
        console.error('Error closing IMAP connection during shutdown:', error);
      }
    }
    
    // Close SMTP transporter
    if (this.transporter) {
      try {
        console.log('Closing SMTP transporter...');
        this.transporter.close();
      } catch (error) {
        console.error('Error closing SMTP transporter:', error);
      }
    }
    
    console.log('EmailReminderService stopped');
  }
}
