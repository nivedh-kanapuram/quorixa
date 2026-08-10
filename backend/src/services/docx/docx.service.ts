import fs from 'fs';
import mammoth from 'mammoth';
import { cleanText } from '../../utils/text-cleaner';

export interface DocxExtractionResult {
  text: string;
  metadata: Record<string, unknown>;
}

export const extractDocx = async (
  filePath: string
): Promise<DocxExtractionResult> => {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: cleanText(result.value),
    metadata: result.messages.reduce<Record<string, unknown>>(
      (acc, message, index) => {
        acc[`message_${index}`] = message.message;
        return acc;
      },
      {}
    ),
  };
};
