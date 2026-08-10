export interface ChunkData {
  documentId: string;
  chunkIndex: number;
  text: string;
  createdAt: Date;
}

const MAX_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 800;
const OVERLAP_SIZE = 180;

const normalizeParagraph = (paragraph: string): string =>
  paragraph.replace(/\s+/g, ' ').trim();

const splitLongParagraph = (paragraph: string): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < paragraph.length) {
    let end = Math.min(start + MAX_CHUNK_SIZE, paragraph.length);
    let slice = paragraph.slice(start, end);

    if (end < paragraph.length) {
      const lastSpace = slice.lastIndexOf(' ');
      if (lastSpace > MIN_CHUNK_SIZE / 2) {
        slice = slice.slice(0, lastSpace);
        end = start + lastSpace;
      }
    }

    chunks.push(slice.trim());

    if (end >= paragraph.length) {
      break;
    }

    const overlapStart = Math.max(end - OVERLAP_SIZE, start);
    start = overlapStart;
  }

  return chunks;
};

export const chunkText = (documentId: string, rawText: string): ChunkData[] => {
  const paragraphs = rawText
    .split(/\n{2,}/g)
    .map(normalizeParagraph)
    .filter(Boolean);

  const chunks: ChunkData[] = [];
  let currentChunk = '';
  let chunkIndex = 0;

  const pushChunk = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    chunks.push({
      documentId,
      chunkIndex: chunkIndex++,
      text: trimmed,
      createdAt: new Date(),
    });
  };

  const addParagraph = (paragraph: string): void => {
    if (!currentChunk) {
      currentChunk = paragraph;
      return;
    }

    const separator = currentChunk.endsWith('\n') ? '' : '\n\n';
    const combined = `${currentChunk}${separator}${paragraph}`;

    if (combined.length <= MAX_CHUNK_SIZE) {
      currentChunk = combined;
      return;
    }

    if (paragraph.length > MAX_CHUNK_SIZE) {
      pushChunk(currentChunk);
      currentChunk = '';
      const splitParagraphs = splitLongParagraph(paragraph);
      splitParagraphs.forEach((segment, index) => {
        if (index === 0) {
          currentChunk = segment;
          return;
        }

        pushChunk(currentChunk);
        currentChunk = segment;
      });
      return;
    }

    pushChunk(currentChunk);
    const overlap = currentChunk.slice(-OVERLAP_SIZE);
    currentChunk = `${overlap}\n\n${paragraph}`.trim();
  };

  for (const paragraph of paragraphs) {
    addParagraph(paragraph);
  }

  if (currentChunk) {
    pushChunk(currentChunk);
  }

  return chunks.filter((chunk) => chunk.text.length > 0);
};
