import fs from 'fs/promises';
import path from 'path';
import {
  DocumentModel,
  DocumentMetadata,
  DocumentStatus,
} from '../models/document.model';
import { SortOrder } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { processDocument } from './processor/processor.service';
import { fetchYoutubeTitle } from './youtube/youtube.service';
import { createDocumentEmbeddings } from './vector.service';
import { ChunkModel } from '../models/chunk.model';
import { logger } from '../config/logger';
import { AppError } from '../errors/app-error';

export interface LibraryQueryOptions {
  page: number;
  limit: number;
  search: string;
  sort: string;
}

export interface LibraryDocumentSummary {
  documentId: string;
  filename: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: DocumentStatus;
  pageCount: number;
}

export interface LibraryDocumentsResult {
  documents: LibraryDocumentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const uploadDirectory = path.resolve(__dirname, '../../uploads');

const getDocumentTypeFromMime = (
  mimeType: string,
  filename?: string
): string => {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return 'note';
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType === 'video/youtube') {
    return 'youtube';
  }

  if (filename) {
    const extension = path.extname(filename).toLowerCase();
    if (['.pdf'].includes(extension)) return 'pdf';
    if (['.txt', '.md'].includes(extension)) return 'note';
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) return 'image';
  }

  return 'unknown';
};

const normalizeSortField = (sort: string): Record<string, SortOrder> => {
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');

  const map: Record<string, string> = {
    uploadDate: 'uploadedAt',
    size: 'size',
    status: 'status',
    pageCount: 'pageCount',
  };

  const dbField = map[field] ?? 'uploadedAt';
  return { [dbField]: direction };
};

const buildLibrarySummary = (
  document: DocumentMetadata
): LibraryDocumentSummary => ({
  documentId: document._id.toString(),
  filename: document.title ?? document.originalFilename,
  type: getDocumentTypeFromMime(document.mimeType, document.originalFilename),
  size: document.size,
  uploadDate: document.uploadedAt,
  status: document.status,
  pageCount: document.pageCount ?? 0,
});

const processStoredDocument = async (
  document: DocumentMetadata,
  filePath: string
): Promise<{
  text: string;
  pageCount: number;
  metadata: Record<string, unknown>;
}> => {
  const result = await processDocument({
    path: filePath,
    mimeType: document.mimeType,
  });
  const pageCount =
    typeof result.metadata.pageCount === 'number'
      ? result.metadata.pageCount
      : 0;

  return {
    text: result.text,
    pageCount: result.type === 'pdf' ? pageCount : 0,
    metadata: result.metadata,
  };
};

export const createDocumentMetadata = async (
  file: Express.Multer.File
): Promise<DocumentMetadata> => {
  const document = await DocumentModel.create({
    originalFilename: file.originalname,
    storedFilename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    status: 'Pending',
  });

  try {
    logger.info(
      { file: file.originalname, documentId: document._id },
      'Upload started'
    );

    await document.updateOne({ status: 'Processing' });
    logger.info({ documentId: document._id }, 'Processing started');

    const filePath = path.resolve(uploadDirectory, file.filename);
    const processedData = await processStoredDocument(document, filePath);

    if (!processedData.text.trim()) {
      throw new AppError(
        'The uploaded document contains no readable text. Please upload a file with text content.',
        422
      );
    }

    await document.updateOne({
      text: processedData.text,
      pageCount: processedData.pageCount,
      metadata: processedData.metadata,
    });

    logger.info({ documentId: document._id }, 'Embedding generation started');
    const embeddingResult = await createDocumentEmbeddings(
      document._id.toString()
    );
    logger.info(
      { documentId: document._id, ...embeddingResult },
      'Embedding generation completed'
    );

    await document.updateOne({
      status: 'Completed',
      processedAt: new Date(),
      processingError: '',
    });
    logger.info({ documentId: document._id }, 'Processing completed');

    return await DocumentModel.findById(document._id).orFail();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown processing error';
    logger.error(
      { documentId: document._id, error: message },
      'Processing failed'
    );
    await document.updateOne({
      status: 'Failed',
      processingError: message,
      processedAt: new Date(),
    });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Document processing failed: ${message}`, 500);
  }
};

export const getLibraryDocuments = async (
  options: LibraryQueryOptions
): Promise<LibraryDocumentsResult> => {
  const { page, limit, search, sort } = options;
  const filter = search
    ? {
        originalFilename: {
          $regex: search,
          $options: 'i',
        },
      }
    : {};

  const total = await DocumentModel.countDocuments(filter);
  const documents = await DocumentModel.find(filter)
    .sort(normalizeSortField(sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  return {
    documents: documents.map(buildLibrarySummary),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getDocumentById = async (
  id: string
): Promise<DocumentMetadata> => {
  if (!isValidObjectId(id)) {
    throw new AppError('Document not found', 404);
  }

  const document = await DocumentModel.findById(id).exec();
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return document;
};

const removeDocumentChunks = async (documentId: string): Promise<void> => {
  await ChunkModel.deleteMany({ documentId }).exec();
};

const removeStoredFile = async (storedFilename: string): Promise<void> => {
  if (!storedFilename) {
    return;
  }

  const filePath = path.resolve(uploadDirectory, storedFilename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};

const UNHELPFUL_PROCESSING_MESSAGES =
  /failed to fetch|fetch failed|econnrefused|enotfound|etimedout|socket hang up|undici|cause:/i;

const friendlyProcessingError = (rawMessage: string): string =>
  UNHELPFUL_PROCESSING_MESSAGES.test(rawMessage)
    ? 'Processing is temporarily unavailable. Please try again later.'
    : rawMessage;

export const deleteDocumentById = async (id: string): Promise<void> => {
  const document = await getDocumentById(id);

  await removeDocumentChunks(document._id.toString());
  await removeStoredFile(document.storedFilename);
  await DocumentModel.deleteOne({ _id: id }).exec();
};

export const createYoutubeDocument = async (
  url: string
): Promise<DocumentMetadata> => {
  const processedData = await processDocument({
    url,
    mimeType: 'video/youtube',
  });

  const text = processedData.text;
  if (!text.trim()) {
    throw new AppError(
      'This YouTube video does not have an accessible transcript or captions.',
      422,
      { code: 'YOUTUBE_TRANSCRIPT_UNAVAILABLE' }
    );
  }

  const videoId =
    typeof processedData.metadata.videoId === 'string'
      ? processedData.metadata.videoId
      : 'transcript';

  const fetchedTitle = await fetchYoutubeTitle(url);
  const displayTitle = fetchedTitle ?? `YouTube Video · ${videoId}`;
  if (!fetchedTitle) {
    logger.warn({ videoId }, 'YouTube title unavailable; using fallback title');
  }

  const document = await DocumentModel.create({
    originalFilename: url,
    storedFilename: `youtube-${videoId}`,
    mimeType: 'video/youtube',
    size: text.length,
    status: 'Processing',
    title: displayTitle,
  });

  try {
    logger.info({ url, documentId: document._id }, 'YouTube upload started');
    logger.info({ documentId: document._id }, 'Processing started');

    await document.updateOne({
      text,
      pageCount: 0,
      metadata: processedData.metadata,
    });

    logger.info({ documentId: document._id }, 'Embedding generation started');
    const embeddingResult = await createDocumentEmbeddings(
      document._id.toString()
    );
    logger.info(
      { documentId: document._id, ...embeddingResult },
      'Embedding generation completed'
    );

    await document.updateOne({
      status: 'Completed',
      processedAt: new Date(),
      processingError: '',
    });
    logger.info({ documentId: document._id }, 'Processing completed');

    return await DocumentModel.findById(document._id).orFail();
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : 'Unknown processing error';
    logger.error(
      { documentId: document._id, error: rawMessage },
      'Processing failed'
    );
    const friendlyMessage = friendlyProcessingError(rawMessage);
    await document.updateOne({
      status: 'Failed',
      processingError: friendlyMessage,
      processedAt: new Date(),
    });
    throw new AppError(`YouTube processing failed: ${friendlyMessage}`, 500, {
      code: 'PROCESSING_FAILED',
    });
  }
};

export const reprocessDocumentById = async (
  id: string
): Promise<DocumentMetadata> => {
  const document = await getDocumentById(id);
  const filePath = path.resolve(uploadDirectory, document.storedFilename);

  await removeDocumentChunks(document._id.toString());

  try {
    await document.updateOne({ status: 'Processing', processingError: '' });
    logger.info({ documentId: document._id }, 'Reprocessing started');

    let textToUse = document.text?.trim() ?? '';
    let pageCount = document.pageCount ?? 0;
    let metadata = document.metadata ?? {};

    if (!textToUse) {
      logger.info(
        { documentId: document._id, mimeType: document.mimeType },
        'No extracted text available; reprocessing stored file'
      );
      const processedData = await processStoredDocument(document, filePath);
      textToUse = processedData.text;
      pageCount = processedData.pageCount;
      metadata = processedData.metadata;

      await document.updateOne({
        text: textToUse,
        pageCount,
        metadata,
      });
    } else {
      logger.info(
        { documentId: document._id },
        'Reprocessing using existing extracted text'
      );
    }

    logger.info({ documentId: document._id }, 'Embedding regeneration started');
    const embeddingResult = await createDocumentEmbeddings(
      document._id.toString()
    );
    logger.info(
      { documentId: document._id, ...embeddingResult },
      'Embedding regeneration completed'
    );

    await document.updateOne({
      status: 'Completed',
      processedAt: new Date(),
      processingError: '',
    });

    return await getDocumentById(id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown reprocessing error';
    logger.error(
      { documentId: document._id, error: message },
      'Reprocessing failed'
    );
    await document.updateOne({
      status: 'Failed',
      processingError: message,
      processedAt: new Date(),
    });
    throw new AppError(`Document reprocessing failed: ${message}`, 500);
  }
};

export const renameDocumentById = async (
  id: string,
  name: string
): Promise<DocumentMetadata> => {
  const document = await getDocumentById(id);
  await document.updateOne({ originalFilename: name });
  return await getDocumentById(id);
};
