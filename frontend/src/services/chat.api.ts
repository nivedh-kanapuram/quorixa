import { fetchJson, API_BASE_URL } from './api';

export interface ChatSourceResponse {
  documentId: string;
  chunkIndex: number;
  score: number;
}

export interface ChatQueryResponse {
  success: boolean;
  answer: string;
  sources: ChatSourceResponse[];
}

export async function queryChat(
  question: string,
  documentIds?: string[],
  language?: 'en' | 'te' | 'hi',
): Promise<ChatQueryResponse> {
  const body: { question: string; documentIds?: string[]; language?: string } = { question };
  if (documentIds && documentIds.length > 0) {
    body.documentIds = documentIds;
  }
  if (language && language !== 'en') {
    body.language = language;
  }

  return fetchJson<ChatQueryResponse>(`${API_BASE_URL}/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
