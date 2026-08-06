export const API_BASE_URL = "http://localhost:3000/api";

export const uploadAsset = {
  maxFileSize: 10 * 1024 * 1024,
  acceptedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".md"],
};

export const endpoints = {
  health: `${API_BASE_URL}/health`,
  upload: `${API_BASE_URL}/upload`,
  chat: `${API_BASE_URL}/chat`,
  documents: `${API_BASE_URL}/documents`,
  summarize: `${API_BASE_URL}/summarize`,
};