export type FileType = "pdf" | "image" | "note" | "youtube";

export type UploadStatus = "uploading" | "uploaded" | "processing" | "completed" | "error";

export type LanguageCode = "en" | "te" | "hi";

export type Role = "user" | "assistant";

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  status: UploadStatus;
  uploadedAt: string;
}

export interface LibraryDocument {
  id: string;
  name: string;
  type: FileType;
  size: number;
  sourceName: string;
  language: LanguageCode;
  uploadedAt: string;
}

export interface SourceRef {
  id: string;
  label: string;
  type: FileType;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  sources?: SourceRef[];
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}