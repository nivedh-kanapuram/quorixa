import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript';
import { cleanText } from '../../utils/text-cleaner';
import { AppError } from '../../errors/app-error';

export interface YoutubeExtractionResult {
  text: string;
  videoId: string;
  metadata: Record<string, unknown>;
}

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/i;

export const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.trim().match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
};

const mapTranscriptError = (error: unknown): AppError => {
  if (error instanceof YoutubeTranscriptDisabledError) {
    return new AppError(
      'This YouTube video does not have an accessible transcript or captions.',
      422,
      { code: 'YOUTUBE_TRANSCRIPT_UNAVAILABLE' }
    );
  }

  if (error instanceof YoutubeTranscriptNotAvailableError) {
    return new AppError(
      'This YouTube video does not have an accessible transcript or captions.',
      422,
      { code: 'YOUTUBE_TRANSCRIPT_UNAVAILABLE' }
    );
  }

  if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
    return new AppError(
      'This YouTube video does not have an accessible transcript or captions.',
      422,
      { code: 'YOUTUBE_TRANSCRIPT_UNAVAILABLE' }
    );
  }

  if (error instanceof YoutubeTranscriptVideoUnavailableError) {
    return new AppError('This YouTube video is no longer available.', 422, {
      code: 'YOUTUBE_VIDEO_UNAVAILABLE',
    });
  }

  if (error instanceof YoutubeTranscriptTooManyRequestError) {
    return new AppError(
      'YouTube is temporarily limiting requests from this network. Please try again later.',
      429,
      { code: 'YOUTUBE_RATE_LIMITED' }
    );
  }

  if (error instanceof YoutubeTranscriptError) {
    return new AppError(
      'Could not retrieve a transcript for this YouTube link. Please check the URL and try again.',
      422,
      { code: 'YOUTUBE_TRANSCRIPT_UNAVAILABLE' }
    );
  }

  if (error instanceof Error && error.name === 'TypeError') {
    return new AppError(
      'Could not reach YouTube right now. Please try again later.',
      503,
      { code: 'YOUTUBE_SERVICE_UNAVAILABLE' }
    );
  }

  return new AppError(
    'Could not fetch the YouTube transcript right now. Please try again later.',
    503,
    { code: 'YOUTUBE_SERVICE_UNAVAILABLE' }
  );
};

/**
 * Fetches the video's real title via YouTube's public oEmbed endpoint.
 * No API key required. Returns null when the title cannot be fetched so the
 * caller can fall back gracefully without failing the upload.
 */
export const fetchYoutubeTitle = async (
  url: string
): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: controller.signal }
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { title?: unknown };
    return typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const extractYoutubeTranscript = async (
  url: string
): Promise<YoutubeExtractionResult> => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new AppError(
      'Invalid YouTube link. Use a watch or youtu.be link.',
      400,
      { code: 'INVALID_YOUTUBE_URL' }
    );
  }

  let transcript;
  try {
    transcript = await fetchTranscript(videoId);
  } catch (error) {
    throw mapTranscriptError(error);
  }

  const text = cleanText(transcript.map((item) => item.text).join(' '));

  return {
    text,
    videoId,
    metadata: {
      transcriptLength: transcript.length,
      videoId,
      url,
    },
  };
};
