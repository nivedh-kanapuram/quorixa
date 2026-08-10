export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

type ApiPayload = Record<string, unknown> | null;

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: ApiPayload;

  constructor(message: string, status: number, payload: ApiPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    const isAbort =
      typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError';
    throw new ApiError(
      isAbort
        ? 'The request took too long. Please try again.'
        : 'Backend is unavailable. Please make sure the server is running, then try again.',
      0,
      { code: isAbort ? 'REQUEST_ABORTED' : 'NETWORK_ERROR' }
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data: unknown = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.message === 'string'
        ? data.message
        : response.statusText || 'Request failed';
    throw new ApiError(message, response.status, isRecord(data) ? data : null);
  }

  return data as T;
}