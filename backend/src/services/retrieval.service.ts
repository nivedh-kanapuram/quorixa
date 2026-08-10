import { ChunkModel } from '../models/chunk.model';
import { generateEmbedding } from './embedding.service';
import {
  buildChunkFilter,
  retrieveRelevantChunksLocally,
  shouldFallbackToLocalRetrieval,
} from './local-retrieval.service';
import { logger } from '../config/logger';

export interface RetrievedChunk {
  documentId: string;
  chunkIndex: number;
  text: string;
  score: number;
}

const dotProduct = (a: number[], b: number[]): number =>
  a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

const magnitude = (vector: number[]): number =>
  Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have same dimensionality');
  }

  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct(a, b) / (magA * magB);
};

export const retrieveRelevantChunks = async (
  query: string,
  documentIds?: string[]
): Promise<RetrievedChunk[]> => {
  logger.info({ query, documentIds }, 'Retrieval started');

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
    logger.info({ query }, 'Query embedding created');
  } catch (error) {
    if (!shouldFallbackToLocalRetrieval(error)) {
      throw error;
    }
    logger.warn(
      { err: error },
      'Embedding provider unavailable; falling back to local retrieval'
    );
    return retrieveRelevantChunksLocally(query, documentIds);
  }

  const filter = buildChunkFilter(documentIds);
  const chunks = await ChunkModel.find(filter).lean();
  logger.info(
    { totalChunks: chunks.length },
    'Loaded chunk embeddings from MongoDB'
  );

  const scoredChunks = chunks
    .map((chunk) => ({
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  logger.info({ retrieved: scoredChunks.length }, 'Similarity search finished');

  return scoredChunks;
};
