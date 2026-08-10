import { ChunkModel } from '../models/chunk.model';
import { logger } from '../config/logger';
import { RetrievedChunk } from './retrieval.service';

export interface LocalChunkSource {
  documentId: string;
  chunkIndex: number;
  text: string;
}

const ENGLISH_STOP_WORDS = new Set(
  `a an the of to and or in on for with at by is are was were be been being this that these those it its as from about what when where which who how why not no do does did can could will would should may might must i you he she we they there their your my our have has had don't isn't it's there's`.split(
    /\s+/
  )
);

const HINDI_STOP_WORDS = new Set(
  `है हैं का की के को से में पर और यह ये वह वे एक इस उस कि कर हो था थी थे करना हुआ हुए भी तो ने`.split(
    /\s+/
  )
);

const TELUGU_STOP_WORDS = new Set(
  `మరియు లో కు కి కే తో నుండి వరకు పై మీద కింద వల్ల ద్వారా కోసం గా ను లు ఒక ఈ ఆ అని అంటే మాత్రమే కూడా చేసి మరియు`.split(
    /\s+/
  )
);

const STOP_WORDS = new Set([
  ...ENGLISH_STOP_WORDS,
  ...HINDI_STOP_WORDS,
  ...TELUGU_STOP_WORDS,
]);

export const tokenizeText = (text: string): string[] =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));

export const buildChunkFilter = (
  documentIds?: string[]
): Record<string, unknown> =>
  documentIds && documentIds.length > 0
    ? { documentId: { $in: documentIds } }
    : {};

/**
 * Dependency-free lexical relevance ranking over already-stored chunks.
 * Unicode-safe tokenization (English / Telugu / Hindi), stop-word filtering
 * and TF-IDF-style scoring. Score is normalized to 0..1 so it is comparable
 * with vector scores; chunks with zero overlap are excluded.
 */
export const rankChunksLocally = (
  query: string,
  chunks: LocalChunkSource[],
  limit = 5
): RetrievedChunk[] => {
  const queryTokens = tokenizeText(query);
  if (queryTokens.length === 0 || chunks.length === 0) {
    return [];
  }

  const chunkTokens = chunks.map((chunk) => new Set(tokenizeText(chunk.text)));

  const documentFrequency = new Map<string, number>();
  for (const tokens of chunkTokens) {
    for (const token of tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const totalChunks = chunks.length;
  const idf = (token: string): number =>
    Math.log(1 + totalChunks / (1 + (documentFrequency.get(token) ?? 0)));

  const queryWeights = new Map<string, number>();
  let queryWeightTotal = 0;
  for (const token of queryTokens) {
    const weight = idf(token);
    queryWeights.set(token, weight);
    queryWeightTotal += weight;
  }

  const scored = chunks.map((chunk, index) => {
    let sum = 0;
    for (const token of chunkTokens[index] ?? []) {
      if (queryWeights.has(token)) {
        sum += queryWeights.get(token) ?? 0;
      }
    }
    return {
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score: queryWeightTotal > 0 ? sum / queryWeightTotal : 0,
    };
  });

  return scored
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/**
 * Only fall back to local retrieval for provider availability/quota/network
 * failures. Application bugs (validation, our own thrown errors) surface.
 */
export const shouldFallbackToLocalRetrieval = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = (error as { status?: number }).status;
  if (error.name === 'ApiError' && typeof status === 'number') {
    if (status === 429 || (status >= 500 && status <= 599)) {
      return true;
    }
  }

  return /resource_exhausted|quota|rate ?limit|ratelimit|timed? ?out|fetch failed|econnrefused|enetunreach|socket hang up|unavailable|empty embedding response/i.test(
    error.message
  );
};

export const retrieveRelevantChunksLocally = async (
  query: string,
  documentIds?: string[]
): Promise<RetrievedChunk[]> => {
  const chunks = await ChunkModel.find(buildChunkFilter(documentIds)).lean();
  logger.info(
    { totalChunks: chunks.length },
    'Loaded chunks from MongoDB for local retrieval'
  );

  const ranked = rankChunksLocally(
    query,
    chunks.map((chunk) => ({
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
    }))
  );

  logger.info({ retrieved: ranked.length }, 'Local retrieval finished');

  return ranked;
};
