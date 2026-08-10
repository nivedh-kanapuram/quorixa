import path from 'path';
import fs from 'fs/promises';
import { extractPdf } from '../pdf/pdf.service';
import { extractDocx } from '../docx/docx.service';
import { extractImageText } from '../image/image-ocr.service';
import { extractYoutubeTranscript } from '../youtube/youtube.service';
import { assessTextQuality } from '../../utils/text-quality';
import { AppError } from '../../errors/app-error';

export type DocumentType = 'pdf' | 'docx' | 'image' | 'youtube' | 'note';

export interface ProcessorResult {
  type: DocumentType;
  text: string;
  metadata: Record<string, unknown>;
}

const UNREADABLE_MESSAGE =
  "We couldn't reliably read the text in this file. Please upload a clearer scan or a file with a selectable text layer.";

export const processDocument = async (source: {
  path?: string;
  url?: string;
  mimeType?: string;
}): Promise<ProcessorResult> => {
  if (source.url) {
    const youtubeResult = await extractYoutubeTranscript(source.url);
    return {
      type: 'youtube',
      text: youtubeResult.text,
      metadata: youtubeResult.metadata,
    };
  }

  if (!source.path || !source.mimeType) {
    throw new Error('Document source path and mimeType are required');
  }

  const extension = path.extname(source.path).toLowerCase();

  if (source.mimeType === 'application/pdf' || extension === '.pdf') {
    const pdfResult = await extractPdf(source.path);
    return {
      type: 'pdf',
      text: pdfResult.text,
      metadata: pdfResult.metadata,
    };
  }

  if (
    source.mimeType === 'text/plain' ||
    source.mimeType === 'text/markdown' ||
    extension === '.txt' ||
    extension === '.md'
  ) {
    const raw = await fs.readFile(source.path, 'utf8');
    const text = raw.replace(/^\uFEFF/, '').trim();
    return {
      type: 'note',
      text,
      metadata: { format: extension === '.md' ? 'markdown' : 'text' },
    };
  }

  if (
    source.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === '.docx'
  ) {
    const docxResult = await extractDocx(source.path);
    return {
      type: 'docx',
      text: docxResult.text,
      metadata: docxResult.metadata,
    };
  }

  if (
    source.mimeType.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.webp'].includes(extension)
  ) {
    const imageResult = await extractImageText(source.path);
    const quality = assessTextQuality(imageResult.text);
    if (!quality.valid) {
      throw new AppError(UNREADABLE_MESSAGE, 422, {
        code: 'DOCUMENT_UNREADABLE',
        reasons: quality.reasons,
      });
    }
    return {
      type: 'image',
      text: imageResult.text,
      metadata: {
        ...imageResult.metadata,
        languages: imageResult.languages,
      },
    };
  }

  throw new Error(`Unsupported document type: ${source.mimeType}`);
};
