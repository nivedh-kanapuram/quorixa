export type DetectedLanguage = 'eng' | 'tel' | 'hin';

const TELUGU_RANGE = /[\u0C00-\u0C7F]/;
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;
const LATIN_RANGE = /[A-Za-z]/;

export const detectLanguages = (text: string): DetectedLanguage[] => {
  if (!text) {
    return [];
  }

  const languages: DetectedLanguage[] = [];
  if (LATIN_RANGE.test(text)) languages.push('eng');
  if (TELUGU_RANGE.test(text)) languages.push('tel');
  if (DEVANAGARI_RANGE.test(text)) languages.push('hin');
  return languages;
};

const LANGUAGE_NAMES: Record<DetectedLanguage, string> = {
  eng: 'English',
  tel: 'తెలుగు',
  hin: 'हिन्दी',
};

export const formatLanguages = (languages: string[]): string => {
  const known = languages.filter(
    (lang): lang is DetectedLanguage =>
      lang === 'eng' || lang === 'tel' || lang === 'hin'
  );
  if (known.length === 0) {
    return 'Unknown language';
  }
  return known.map((lang) => LANGUAGE_NAMES[lang]).join(' + ');
};
