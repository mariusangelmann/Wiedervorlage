import { promises as fs } from 'fs';
import path from 'path';

export interface Translations {
  timeUnits: {
    seconds: string;
    minutes: string;
    hours: string;
    days: string;
    weeks: string;
  };
  emails: {
    confirmationSubject: string;
    confirmationBody: string;
    reminderSubject: string;
    reminderBody: string;
    unknownInterval: string;
  };
  console: {
    serviceStart: string;
    debugMode: string;
    mainLoopError: string;
    heartbeatEnabled: string;
  };
}

export class TranslationService {
  private translations: { [key: string]: Translations } = {};
  private currentLanguage: string;
  private customTranslationsPath?: string;

  constructor(defaultLanguage: string = 'en', customTranslationsPath?: string) {
    this.currentLanguage = defaultLanguage;
    this.customTranslationsPath = customTranslationsPath;
  }

  async loadTranslations(): Promise<void> {
    try {
      const baseDir = path.join(process.cwd(), 'src', 'translations');
      console.log('Loading translations from:', baseDir);
      
      // Load built-in translations
      const languages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'ja', 'zh', 'hi', 'ar', 'uk', 'ko'];
      
      for (const lang of languages) {
        try {
          console.log(`Loading ${lang.toUpperCase()} translations...`);
          const langPath = path.join(baseDir, `${lang}.json`);
          const langTranslations = await fs.readFile(langPath, 'utf-8');
          this.translations[lang] = JSON.parse(langTranslations);
        } catch (error) {
          console.warn(`Failed to load ${lang} translations:`, error);
        }
      }

      // Load custom translations if path is provided
      if (this.customTranslationsPath) {
        try {
          console.log('Loading custom translations from:', this.customTranslationsPath);
          const customTranslations = await fs.readFile(this.customTranslationsPath, 'utf-8');
          const parsed = JSON.parse(customTranslations);
          // Merge custom translations with existing ones or add as new language
          if (parsed.language && parsed.translations) {
            this.translations[parsed.language] = {
              ...this.translations[parsed.language] || {},
              ...parsed.translations
            };
          }
        } catch (error) {
          console.error('Failed to load custom translations:', error);
        }
      }
      
      console.log('Successfully loaded translations for languages:', Object.keys(this.translations));
    } catch (error) {
      console.error('Error loading translations:', error);
      throw error; // Re-throw to handle in EmailReminderService
    }
  }

  setLanguage(language: string): void {
    if (!this.translations[language]) {
      console.warn(`Language ${language} not found, falling back to English`);
      this.currentLanguage = 'en';
      return;
    }
    this.currentLanguage = language;
  }

  translate(key: string, params: { [key: string]: string | number } = {}): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (!value || !value[k]) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      value = value[k];
    }

    return Object.entries(params).reduce(
      (text, [key, val]) => text.replace(`{${key}}`, String(val)),
      value
    );
  }

  getTimeUnitText(unit: string): string {
    const unitMap: { [key: string]: string } = {
      s: 'seconds',
      m: 'minutes',
      h: 'hours',
      d: 'days',
      w: 'weeks'
    };
    return this.translate(`timeUnits.${unitMap[unit]}`);
  }
}
