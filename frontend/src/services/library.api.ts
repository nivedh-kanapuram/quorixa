import { fetchJson, API_BASE_URL } from './api';
import type { DocumentStatus, LibraryDocument } from '../types';

export interface LibraryDocumentResponse {
  documentId: string;
  filename: string;
  type: string;
  size: number;
  uploadDate: string;
  status: string;
  pageCount: number;
}

export interface LibraryDocumentsApiResponse {
  success: boolean;
  data: {
    documents: LibraryDocumentResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LibraryQueryOptions {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

const normalizeFileType = (type: string): LibraryDocument['type'] => {
  if (type === 'pdf' || type === 'image' || type === 'youtube') {
    return type;
  }

  return 'note';
};

const normalizeStatus = (status: string): DocumentStatus | undefined => {
  if (status === 'Pending' || status === 'Processing' || status === 'Completed' || status === 'Failed') {
    return status;
  }
  return undefined;
};

export const mapLibraryDocument = (document: LibraryDocumentResponse): LibraryDocument => ({
  id: document.documentId,
  name: document.filename,
  type: normalizeFileType(document.type),
  size: document.size,
  sourceName: document.filename,
  language: 'en',
  uploadedAt: document.uploadDate,
  status: normalizeStatus(document.status),
  pageCount: document.pageCount,
});

export async function getLibraryDocuments(options: LibraryQueryOptions = {}): Promise<LibraryDocument[]> {
  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 100));
  if (options.search) params.set('search', options.search);
  if (options.sort) params.set('sort', options.sort);

  const response = await fetchJson<LibraryDocumentsApiResponse>(
    `${API_BASE_URL}/library?${params.toString()}`,
  );

  return response.data.documents.map(mapLibraryDocument);
}

export async function deleteLibraryDocument(documentId: string): Promise<void> {
  await fetchJson(`${API_BASE_URL}/library/${documentId}`, {
    method: 'DELETE',
  });
}

export async function reprocessLibraryDocument(documentId: string): Promise<void> {
  await fetchJson(`${API_BASE_URL}/library/${documentId}/reprocess`, {
    method: 'PATCH',
  });
}
