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
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtpServer,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpPort === 465,
        auth: {
          user: emailConfig.username,
          pass: emailConfig.password,
        },
      });
      console.log('SMTP transporter created successfully');
    } catch (error) {
      console.error('Error creating SMTP transporter:', error);
      throw error;
    }

    console.log('Setting up IMAP config...');
    try {
      this.imapConfig = {
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
      console.log('IMAP config created successfully');
    } catch (error) {
      console.error('Error creating IMAP config:', error);
      throw error;
    }
    
    console.log('EmailReminderService initialized successfully');
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

  private async sendConfirmation(to: string, reminderTime: Date): Promise<void> {
    const timeDiff = reminderTime.getTime() - new Date().getTime();
    const timeStr = formatTimeString(timeDiff, this.translator);

    await this.transporter.sendMail({
      from: this.emailConfig.username,
      to,
      subject: this.translator.translate('emails.confirmationSubject'),
      text: this.translator.translate('emails.confirmationBody', {
        timeStr,
        deliveryTime: reminderTime.toLocaleString(this.settings.language === 'de' ? 'de-DE' : 'en-US')
      })
    });
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

      await this.transporter.sendMail({
        from: this.emailConfig.username,
        to: reminder.originalFrom,
        subject: this.translator.translate('emails.reminderSubject', { subject: reminder.subject }),
        text: textBody,
        html: reminder.html || textBody,
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
      
      if (this.settings.debugMode) {
        console.log('[DEBUG] IMAP connection established successfully');
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
        bodies: [
          // Get specific headers we need
          'HEADER.FIELDS (FROM TO CC BCC DELIVERED-TO X-ORIGINAL-TO SUBJECT MESSAGE-ID IN-REPLY-TO REFERENCES)',
          // Get the message body
          'TEXT',
          // Get all headers for complete parsing
          'HEADER'
        ],
        markSeen: true,
        struct: true
      };

      if (this.settings.debugMode) {
        console.log('[DEBUG] Using fetch options:', JSON.stringify(fetchOptions, null, 2));
      }

      if (this.settings.debugMode) {
        console.log('[DEBUG] IMAP fetch options:', fetchOptions);
        console.log('[DEBUG] Searching for unread messages');
      }

      const searchCriteria = ['UNSEEN'];
      const messages = await connection.search(searchCriteria, fetchOptions);
      
      if (this.settings.debugMode) {
        console.log(`[DEBUG] Found ${messages.length} unread messages`);
      }

      for (const message of messages) {
        if (this.settings.debugMode) {
          console.log('[DEBUG] Processing message:', message.attributes?.uid);
        }

        // Get the entire message as a single string
        const allHeadersPart = message.parts.find(p => p.which === 'HEADER');
        if (!allHeadersPart) {
          console.log('[DEBUG] Missing required message parts');
          continue;
        }
        const allHeaders = allHeadersPart.body as string;

        // Use mailparser to parse the entire message
        const parsedMessage = await simpleParser(allHeaders);

        if (this.settings.debugMode) {
          console.log('[DEBUG] Parsed message:', parsedMessage);
        }

        const { to, cc, bcc, from, subject, messageId, text, html } = parsedMessage;

        // Helper function to convert header values to strings
        const headerToString = (value: string | string[]): string => {
          return Array.isArray(value) ? value.join(', ') : value;
        };
        
        // Manually extract header lines we need
        const headerLines = [
          { key: 'delivered-to', line: headerToString(parsedMessage.headerLines?.find(h => h.key === 'delivered-to')?.line || '') },
          { key: 'x-original-to', line: headerToString(parsedMessage.headerLines?.find(h => h.key === 'x-original-to')?.line || '') }
        ];
        
        // Parse headers while maintaining original structure
        const parsed = {
          to: to || '',
          cc: cc || '',
          bcc: bcc || '',
          from: from || '',
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
            from: headerToString(parsed.from?.value || ''),
            subject: parsed.subject,
            deliveredTo: parsed.headerLines.find(h => h.key === 'delivered-to')?.line,
            originalTo: parsed.headerLines.find(h => h.key === 'x-original-to')?.line
          });
        }

        // Convert header values to strings
        const toStr = Array.isArray(parsed.to) ? parsed.to.join(', ') : parsed.to;
        const ccStr = Array.isArray(parsed.cc) ? parsed.cc.join(', ') : parsed.cc;
        const bccStr = Array.isArray(parsed.bcc) ? parsed.bcc.join(', ') : parsed.bcc;

        // Get all possible recipient addresses
        const allRecipients = [
          // Regular recipients
          ...toStr.split(',').map((addr: string) => ({ text: addr.text.trim() })),
          ...ccStr.split(',').map((addr: string) => ({ text: addr.text.trim() })),
          ...bccStr.split(',').map((addr: string) => ({ text: addr.text.trim() })),
          // Additional headers that might contain the reminder address
          // Extract addresses from additional headers, handling potential multiple addresses
          ...parsed.headerLines
            .filter(h => ['delivered-to', 'x-original-to'].includes(h.key.toLowerCase()))
            .map(h => h.line)
            .flatMap(line => line.split(','))
            .map(addr => {
              // Extract email address from possible "Name <email>" format
              const match = addr.trim().match(/<([^>]+)>/);
              const email = match ? match[1] : addr.trim();
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
            console.log('[DEBUG] Checking address format:', {
              address,
              hasBaseDomain: address.includes(this.emailConfig.baseDomain.toLowerCase()),
              hasRemindPrefix: address.includes('remind+')
            });
          }
          const domain = this.emailConfig.baseDomain.toLowerCase();
        return address && 
               (address.endsWith(`@${domain}`) || address.endsWith(`@${domain}>`)) && 
               address.includes('remind+');
        });
        
        if (this.settings.debugMode && reminderAddress) {
          console.log('[DEBUG] Found reminder address:', reminderAddress);
        }
        
        const to = reminderAddress?.text || '';

        if (this.settings.debugMode) {
          console.log('[DEBUG] Message details:', {
            to,
            from: headerToString(parsed.from),
            subject: parsed.subject
          });
        }

        if (to.includes(this.emailConfig.baseDomain)) {
          if (this.settings.debugMode) {
            console.log('[DEBUG] Found matching domain in recipient');
          }

          const reminderInfo = await this.parseReminderAddress(to);
          if (reminderInfo) {
            if (this.settings.debugMode) {
              console.log('[DEBUG] Valid reminder address found:', {
                time: reminderInfo.reminderTime,
                unit: reminderInfo.unit,
                amount: reminderInfo.amount
              });
            }

            // Convert from header to string
            const fromStr = Array.isArray(parsed.from) ? parsed.from.join(', ') : parsed.from;
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
    } catch (error) {
      if (this.settings.debugMode) {
        console.log('[DEBUG] Error in checkMailbox:', error);
      }
      if (this.heartbeatService) {
        this.heartbeatService.setHealthStatus(false);
      }
      console.error('Error in checkMailbox:', error);
    } finally {
      if (connection) {
        if (this.settings.debugMode) {
          console.log('[DEBUG] Closing IMAP connection');
        }
        try {
          connection.end();
        } catch (err) {
          console.error('Error closing IMAP connection:', err);
        }
      }
    }
  }

  public async start(): Promise<void> {
    await this.translator.loadTranslations();
    
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

    while (true) {
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

  public stop(): void {
    if (this.heartbeatService) {
      this.heartbeatService.stop();
    }
  }
}
