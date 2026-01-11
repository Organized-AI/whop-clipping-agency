import { z } from 'zod';

// Video quality options for YouTube
export type YouTubeQuality = '2160' | '1440' | '1080' | '720' | '480' | '360';

// Timestamp format validation (supports HH:MM:SS, MM:SS, or seconds)
const timestampRegex = /^(\d{1,2}:)?(\d{1,2}):(\d{2})$|^\d+$/;

// YouTube clip request schema
export const YouTubeClipRequestSchema = z.object({
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Must be a valid YouTube URL' }
  ),
  startTime: z.string().regex(timestampRegex, 'Invalid timestamp format (use HH:MM:SS, MM:SS, or seconds)'),
  endTime: z.string().regex(timestampRegex, 'Invalid timestamp format (use HH:MM:SS, MM:SS, or seconds)'),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional().default('1080'),
  outputName: z.string().optional(),
});

export type YouTubeClipRequest = z.infer<typeof YouTubeClipRequestSchema>;

// YouTube full video download request
export const YouTubeDownloadRequestSchema = z.object({
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Must be a valid YouTube URL' }
  ),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional().default('1080'),
  audioOnly: z.boolean().optional().default(false),
});

export type YouTubeDownloadRequest = z.infer<typeof YouTubeDownloadRequestSchema>;

// Batch clip request (multiple timestamps from one video)
export const YouTubeBatchClipRequestSchema = z.object({
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'Must be a valid YouTube URL' }
  ),
  clips: z.array(z.object({
    startTime: z.string().regex(timestampRegex),
    endTime: z.string().regex(timestampRegex),
    name: z.string().optional(),
  })).min(1).max(20),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional().default('1080'),
});

export type YouTubeBatchClipRequest = z.infer<typeof YouTubeBatchClipRequestSchema>;

// Video metadata from yt-dlp
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  durationString: string;
  channel: string;
  channelId: string;
  uploadDate: string;
  viewCount: number;
  likeCount?: number;
  thumbnail: string;
  categories?: string[];
  tags?: string[];
  chapters?: YouTubeChapter[];
}

export interface YouTubeChapter {
  title: string;
  startTime: number;
  endTime: number;
}

// ScrapCreators YouTube response (for metadata/transcripts)
export interface ScrapCreatorsYouTubeResponse {
  id: string;
  title: string;
  description: string;
  duration: number;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  thumbnailUrl: string;
  transcript?: string;
  transcript_only_text?: string;
}

// Clip result
export interface YouTubeClipResult {
  videoId: string;
  title: string;
  channel: string;
  startTime: string;
  endTime: string;
  duration: number;
  quality: YouTubeQuality;
  localPath: string;
  driveFileId?: string;
  driveUrl?: string;
  folder?: string;
}

// Download progress callback
export type ProgressCallback = (progress: {
  percent: number;
  downloaded: number;
  total: number;
  speed: string;
  eta: string;
}) => void;
