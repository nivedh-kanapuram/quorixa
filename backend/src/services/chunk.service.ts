export interface ChunkData {
  documentId: string;
  chunkIndex: number;
  text: string;
  createdAt: Date;
}

const MAX_CHUNK_SIZE = 1200;
const OVERLAP_SIZE = 150;

const normalizeText = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

const splitIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_SIZE, text.length);

    // Prefer breaking at a word boundary.
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastSpace = slice.lastIndexOf(' ');

      if (lastSpace > MAX_CHUNK_SIZE * 0.5) {
        end = start + lastSpace;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    // Keep a small overlap between chunks.
    start = Math.max(end - OVERLAP_SIZE, start + 1);
  }

  return chunks;
};

export const chunkText = (documentId: string, rawText: string): ChunkData[] => {
  const normalized = normalizeText(rawText);

  if (!normalized) {
    return [];
  }

  const chunks = splitIntoChunks(normalized);

  return chunks.map((text, index) => ({
    documentId,
    chunkIndex: index,
    text,
    createdAt: new Date(),
  }));
};
