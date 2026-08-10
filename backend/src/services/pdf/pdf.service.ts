import fs from 'fs';
import pdfParse from 'pdf-parse';
import { cleanText } from '../../utils/text-cleaner';
import { detectLanguages } from '../../utils/language-detect';
import { assessTextQuality } from '../../utils/text-quality';
import { AppError } from '../../errors/app-error';
import { renderPdfToPageImages } from './pdf-render.service';
import {
  createOcrWorker,
  recognizeWithWorker,
} from '../image/image-ocr.service';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  metadata: Record<string, unknown>;
}

const UNREADABLE_MESSAGE =
  "We couldn't reliably read the text in this file. Please upload a clearer scan or a PDF with a selectable text layer.";

const ocrPdfPages = async (pages: Buffer[]): Promise<string> => {
  const worker = await createOcrWorker();
  try {
    const pageTexts: string[] = [];
    for (const pageImage of pages) {
      const result = await recognizeWithWorker(worker, pageImage);
      pageTexts.push(result.text);
    }
    return cleanText(pageTexts.join('\n\n'));
  } finally {
    await worker.terminate();
  }
};

const validateExtractedText = (text: string): void => {
  const report = assessTextQuality(text);
  if (!report.valid) {
    throw new AppError(UNREADABLE_MESSAGE, 422, {
      code: 'DOCUMENT_UNREADABLE',
      reasons: report.reasons,
    });
  }
};

export const extractPdf = async (
  filePath: string
): Promise<PdfExtractionResult> => {
  const buffer = fs.readFileSync(filePath);

  let nativeText = '';
  let pdf: Awaited<ReturnType<typeof pdfParse>> | null = null;
  try {
    pdf = await pdfParse(buffer);
    nativeText = cleanText(pdf.text || '');
  } catch {
    nativeText = '';
  }

  const nativeReport = assessTextQuality(nativeText);
  const pageCount = pdf?.numpages ?? 0;

  if (nativeReport.valid && pdf) {
    return {
      text: nativeText,
      pageCount,
      metadata: {
        extraction: 'native',
        pageCount,
        languages: detectLanguages(nativeText),
        ...pdf.info,
      },
    };
  }

  const pages = await renderPdfToPageImages(filePath);
  const ocrText = await ocrPdfPages(pages);
  validateExtractedText(ocrText);

  return {
    text: ocrText,
    pageCount: pages.length,
    metadata: {
      extraction: 'ocr',
      pageCount: pages.length,
      languages: detectLanguages(ocrText),
      nativeTextLength: nativeText.length,
      nativeReport: nativeReport.reasons,
    },
  };
};
