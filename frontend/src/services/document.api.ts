import { fetchJson, API_BASE_URL } from './api';

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    originalFilename: string;
    storedFilename: string;
    mimeType: string;
    size: number;
    status: string;
    uploadedAt: string;
    languages?: string[];
  };
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchJson<UploadDocumentResponse>(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function uploadYoutubeTranscript(url: string): Promise<UploadDocumentResponse> {
  return fetchJson<UploadDocumentResponse>(`${API_BASE_URL}/documents/upload/youtube`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
}
