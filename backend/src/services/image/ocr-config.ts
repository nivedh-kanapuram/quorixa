import fs from 'fs';
import path from 'path';

export const OCR_DEFAULT_LANGS = 'eng+tel+hin';

export const LANGUAGE_DATA_FILES: Record<string, string> = {
  eng: 'eng.traineddata',
  tel: 'tel.traineddata',
  hin: 'hin.traineddata',
};

export const TESSDATA_DIR = path.resolve(__dirname, '../../../tessdata');

export class OcrConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrConfigurationError';
    Object.setPrototypeOf(this, OcrConfigurationError.prototype);
  }
}

export const verifyOcrLanguageData = (langs: string): void => {
  const requested = langs
    .split('+')
    .map((lang) => lang.trim())
    .filter(Boolean);

  for (const lang of requested) {
    const file = LANGUAGE_DATA_FILES[lang];
    if (!file) {
      throw new OcrConfigurationError(
        `OCR configuration error: unknown language "${lang}".`
      );
    }
    const fullPath = path.join(TESSDATA_DIR, `${file}.gz`);
    if (!fs.existsSync(fullPath)) {
      throw new OcrConfigurationError(
        `OCR configuration error: language data for "${lang}" is missing (${file}.gz not found in ${TESSDATA_DIR}).`
      );
    }
  }
};
