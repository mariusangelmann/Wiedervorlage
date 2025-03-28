import { TimePatterns } from './types';

export const TIME_PATTERNS: TimePatterns = {
  s: {
    name: 'seconds',
    pattern: new RegExp('remind\\+(\\d+)s'),
    text: 'Sekunden'
  },
  m: {
    name: 'minutes',
    pattern: new RegExp('remind\\+(\\d+)m'),
    text: 'Minuten'
  },
  h: {
    name: 'hours',
    pattern: new RegExp('remind\\+(\\d+)h'),
    text: 'Stunden'
  },
  d: {
    name: 'days',
    pattern: new RegExp('remind\\+(\\d+)d'),
    text: 'Tage'
  },
  w: {
    name: 'weeks',
    pattern: new RegExp('remind\\+(\\d+)w'),
    text: 'Wochen'
  }
};

export function cleanSubject(subject: string): string {
  return subject.replace(/^(?:Re|Fwd|FW|AW):\s*/i, '').replace(/[\u2000-\u206F\u2E00-\u2E7F!'#$%&*+,/:;=?@^`~]/g, '');
}

import { TranslationService } from './translations';

export function formatTimeString(timeDiff: number, translator: TranslationService): string {
  const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days} ${translator.getTimeUnitText('d')}`;
  if (hours > 0) return `${hours} ${translator.getTimeUnitText('h')}`;
  return `${minutes} ${translator.getTimeUnitText('m')}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
