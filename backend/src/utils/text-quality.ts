export interface TextQualityReport {
  valid: boolean;
  suspicious: boolean;
  reasons: string[];
  total: number;
  meaningful: number;
  latin: number;
  telugu: number;
  devanagari: number;
  replacementChars: number;
  symbolChars: number;
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
/* eslint-disable no-useless-escape, no-misleading-character-class */
const SYMBOL_CHARS =
  /[^A-Za-z\u0C00-\u0C7F\u0900-\u097F\p{N}\p{Zs}\p{Cc}.,;:!?()\[\]\{\}<>"'\u00ab\u00bb\u201c\u201d\u2018\u2019|&%+=@#~\u20b9\u00a0\u200b\u200c\u200d\u200e\u200f\u2013\u2014-]/gu;
const BRIDGED_SYMBOLS =
  /[^\p{L}\p{N}\s.,;:!?()\[\]\{\}<>"'\u00ab\u00bb\u201c\u201d\u2018\u2019|&%+=@#~\u20b9\u2013\u2014\-]/gu;
/* eslint-enable no-useless-escape, no-misleading-character-class */
const TELUGU_CHARS = /[\u0C00-\u0C7F]/g;
const DEVANAGARI_CHARS = /[\u0900-\u097F]/g;
const LATIN_CHARS = /[A-Za-z]/g;
const REPLACEMENT_CHARS = /[\uFFFD]/g;
const REPEATED_NON_ALPHA = /(.)\1{7,}/gu;

const countMatches = (text: string, regex: RegExp): number =>
  (text.match(regex) ?? []).length;

export const assessTextQuality = (rawText: string): TextQualityReport => {
  const text = String(rawText ?? '').normalize('NFC');
  const total = text.length;
  const replacementChars = countMatches(text, REPLACEMENT_CHARS);
  const controlChars = countMatches(text, CONTROL_CHARS);
  const latin = countMatches(text, LATIN_CHARS);
  const telugu = countMatches(text, TELUGU_CHARS);
  const devanagari = countMatches(text, DEVANAGARI_CHARS);
  const meaningful = latin + telugu + devanagari;

  const symbolChars = countMatches(text, SYMBOL_CHARS);

  const reasons: string[] = [];
  let valid = true;

  if (total === 0) {
    reasons.push('empty');
    valid = false;
  }

  if (total > 0 && total < 5) {
    reasons.push('too-short');
    valid = false;
  }

  if (meaningful < 8) {
    reasons.push('no-meaningful-script-chars');
    valid = false;
  }

  if (total > 0 && replacementChars / total > 0.03) {
    reasons.push('replacement-chars');
    valid = false;
  }

  if (total > 0 && controlChars / total > 0.02) {
    reasons.push('control-chars');
    valid = false;
  }

  if (meaningful > 0 && symbolChars / meaningful > 0.35) {
    reasons.push('excessive-symbols');
    valid = false;
  }

  if ((text.match(REPEATED_NON_ALPHA) ?? []).length > 0) {
    reasons.push('repeated-garbage');
    valid = false;
  }

  // eslint-disable-next-line no-control-regex
  const bridges = countMatches(text.replace(/\u0000/g, ''), BRIDGED_SYMBOLS);
  if (bridges >= 5 && meaningful > 0 && symbolChars / meaningful > 0.12) {
    reasons.push('mojibake-pattern');
    valid = false;
  }

  const suspicious = total > 0 && (total < 24 || meaningful < 16);

  return {
    valid,
    suspicious,
    reasons,
    total,
    meaningful,
    latin,
    telugu,
    devanagari,
    replacementChars,
    symbolChars,
  };
};
