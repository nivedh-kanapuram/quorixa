import { GoogleGenAI } from '@google/genai';
import { geminiConfig } from '../config/gemini';
import { logger } from '../config/logger';
import pRetry from 'p-retry';

const EMBEDDING_MODEL = 'gemini-embedding-2';
const MAX_RETRIES = 3;

const ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await pRetry(
    async () => {
      const result = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [text],
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error('Empty embedding response from Gemini');
      }

      const contentEmbedding = result.embeddings[0];
      const embedding = contentEmbedding.values;
      if (!embedding || embedding.length === 0) {
        throw new Error('Invalid embedding vector returned');
      }

      return embedding;
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.warn(
          { attempt: error.attemptNumber, message: errorMessage },
          'Embedding request failed, retrying'
        );
      },
    }
  );

  return response;
};
