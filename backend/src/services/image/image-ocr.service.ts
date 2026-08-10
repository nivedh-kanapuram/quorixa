import { createWorker, type Worker } from 'tesseract.js';
import { cleanText } from '../../utils/text-cleaner';
import { detectLanguages } from '../../utils/language-detect';
import {
  OCR_DEFAULT_LANGS,
  TESSDATA_DIR,
  verifyOcrLanguageData,
} from './ocr-config';

export interface ImageOcrExtractionResult {
  text: string;
  languages: string[];
  metadata: Record<string, unknown>;
}

export const createOcrWorker = async (
  langs: string = OCR_DEFAULT_LANGS
): Promise<Worker> => {
  verifyOcrLanguageData(langs);
  return createWorker(langs, 1, {
    langPath: TESSDATA_DIR,
    logger: () => undefined,
  });
};

export const recognizeWithWorker = async (
  worker: Worker,
  imageInput: string | Buffer
): Promise<ImageOcrExtractionResult> => {
  const result = await worker.recognize(imageInput);
  const text = cleanText(result.data.text || '');
  return {
    text,
    languages: detectLanguages(text),
    metadata: {
      confidence: result.data.confidence,
      words: result.data.words.length,
    },
  };
};

export const extractImageText = async (
  filePath: string,
  langs: string = OCR_DEFAULT_LANGS
): Promise<ImageOcrExtractionResult> => {
  const worker = await createOcrWorker(langs);
  try {
    const result = await recognizeWithWorker(worker, filePath);
    return {
      ...result,
      metadata: {
        ...result.metadata,
        ocrLanguages: langs,
      },
    };
  } finally {
    await worker.terminate();
  }
};
