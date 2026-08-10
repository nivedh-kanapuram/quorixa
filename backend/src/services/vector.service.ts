import { logger } from '../config/logger';
import { ChunkModel } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { chunkText } from './chunk.service';
import { generateEmbedding } from './embedding.service';

export interface VectorCreateResult {
  chunksCreated: number;
  timeTakenMs: number;
}

export const createDocumentEmbeddings = async (
  documentId: string
): Promise<VectorCreateResult> => {
  const document = await DocumentModel.findById(documentId).orFail();

  if (!document.text) {
    throw new Error('Document text is required for embedding generation');
  }

  logger.info({ documentId }, 'Chunking started');
  const chunks = chunkText(documentId.toString(), document.text);
  logger.info({ documentId, chunks: chunks.length }, 'Chunking completed');

  const start = Date.now();
  const createdChunks: Promise<void>[] = [];

  for (const chunk of chunks) {
    createdChunks.push(
      (async (): Promise<void> => {
        const embedding = await generateEmbedding(chunk.text);
        await ChunkModel.create({
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          embedding,
          createdAt: chunk.createdAt,
        });
      })()
    );
  }

  await Promise.all(createdChunks);

  const timeTakenMs = Date.now() - start;
  logger.info(
    { documentId, chunksCreated: chunks.length, durationMs: timeTakenMs },
    'Embedding storage completed'
  );

  return {
    chunksCreated: chunks.length,
    timeTakenMs,
  };
};
