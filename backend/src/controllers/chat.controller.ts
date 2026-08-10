import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error';
import { retrieveRelevantChunks } from '../services/retrieval.service';
import { DocumentModel } from '../models/document.model';
import { isValidObjectId } from 'mongoose';
import { aiService } from '../services/ai/ai.service';
import { AIProviderMessage } from '../services/ai/ai-provider.interface';
import { logger } from '../config/logger';

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
};

const chatSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(5000, 'Question cannot exceed 5000 characters'),
  documentIds: z.array(z.string().min(1)).optional(),
  language: z.enum(['en', 'te', 'hi']).optional(),
});

const MAX_CONTEXT_CHARACTERS = 6000;

const selectContextChunks = (
  chunks: { text: string }[]
): { text: string }[] => {
  const included: { text: string }[] = [];
  let total = 0;

  for (const chunk of chunks) {
    if (total + chunk.text.length <= MAX_CONTEXT_CHARACTERS) {
      included.push(chunk);
      total += chunk.text.length;
      continue;
    }

    const budget = MAX_CONTEXT_CHARACTERS - total;
    if (budget > 0) {
      included.push({ text: chunk.text.slice(0, budget) });
      total = MAX_CONTEXT_CHARACTERS;
    }
    break;
  }

  return included;
};

const buildPrompt = (
  question: string,
  language: string | undefined,
  chunks: { text: string }[]
): AIProviderMessage[] => {
  const context = chunks
    .map((chunk, index) => `Chunk ${index + 1}: ${chunk.text}`)
    .join('\n\n');
  const languageInstruction = language ? `Answer in ${language}.` : '';

  const system = [
    'You are a helpful study assistant for students.',
    'You must answer ONLY using the supplied context chunks. Never use outside knowledge or the open web.',
    'If the specific information asked about is present in the context, answer using that content only.',
    'If the context mentions the topic but does not contain the specific detail asked for, describe what the document says about it and state clearly that the specific detail is not provided in the uploaded documents.',
    "If the topic is not mentioned anywhere in the context, reply exactly: 'I couldn't find that information in the uploaded documents.'",
    'Do not mention that you were given context chunks.',
  ]
    .filter(Boolean)
    .join(' ');

  const user = [
    'Context chunks:',
    context || '(no context supplied)',
    '',
    `Question: ${question}`,
    languageInstruction,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
};

export class ChatController {
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = chatSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors.map((err) => err.message).join(', '),
          400
        );
      }

      const { question, documentIds, language } = parsed.data;
      logger.info({ question, documentIds }, 'Question received');

      if (documentIds && documentIds.length === 0) {
        throw new AppError(
          'Select at least one document to ask a question.',
          400
        );
      }

      if (documentIds && documentIds.length > 0) {
        const invalidIds = documentIds.filter((id) => !isValidObjectId(id));
        if (invalidIds.length > 0) {
          throw new AppError(
            'One or more selected documents are invalid.',
            400
          );
        }

        const found = await DocumentModel.countDocuments({
          _id: { $in: documentIds },
        });
        if (found !== documentIds.length) {
          throw new AppError(
            'One or more selected documents no longer exist.',
            400
          );
        }
      }

      const retrievedChunks = await retrieveRelevantChunks(
        question,
        documentIds
      );
      const includedChunks = selectContextChunks(retrievedChunks);
      const messages = buildPrompt(
        question,
        LANGUAGE_MAP[language ?? ''] ?? undefined,
        includedChunks
      );
      logger.info(
        {
          question,
          retrievedChunks: retrievedChunks.length,
          includedChunks: includedChunks.length,
          contextCharacters: includedChunks.reduce(
            (total, chunk) => total + chunk.text.length,
            0
          ),
          questionCharacters: question.length,
          totalPromptCharacters: messages.reduce(
            (total, message) => total + message.content.length,
            0
          ),
        },
        'Grounded prompt built'
      );

      const result = await aiService.generateAnswer(messages);

      const answer = result.text;
      logger.info(
        { question, answerLength: answer.length },
        'Answer generated'
      );

      res.json({
        success: true,
        answer,
        provider: result.provider,
        sources: retrievedChunks.map((chunk) => ({
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          score: chunk.score,
        })),
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      const embeddingQuotaError =
        error instanceof Error &&
        error.name === 'ApiError' &&
        (error as { status?: number }).status === 429;
      if (embeddingQuotaError) {
        next(
          new AppError(
            'Document retrieval is temporarily unavailable due to AI service quota. Please try again shortly.',
            503,
            { code: 'EMBEDDING_QUOTA_EXCEEDED' }
          )
        );
        return;
      }

      logger.error({ err: error }, 'Chat query failed');

      next(
        new AppError(
          'Failed to process your question. Please try again shortly.',
          500
        )
      );
    }
  }
}
