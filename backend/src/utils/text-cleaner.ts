export const cleanText = (rawText: string): string => {
  const normalized = rawText.normalize('NFKC');
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0);

  return lines.join('\n');
};
