import { z } from 'zod';

// Video quality options
export type VideoQuality = '1080' | '720' | '480' | '360';

// ScrapCreators API Response Schema (using passthrough to allow extra fields)
export const ScrapCreatorsClipSchema = z.object({
  id: z.string(),
  slug: z.string(),
  url: z.string().url(),
  embedURL: z.string().url(),
  title: z.string(),
  viewCount: z.number(),
  language: z.string(),
  durationSeconds: z.number(),
  createdAt: z.string(),
  thumbnailURL: z.string().url(),
  videoURL: z.string().optional(),
  broadcaster: z.object({
    id: z.string(),
    login: z.string(),
    displayName: z.string(),
  }).passthrough(),
  game: z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough().nullable(),
  videoQualities: z.array(z.object({
    quality: z.string().optional(),
    sourceURL: z.string().url(),
    frameRate: z.number().optional(),
  }).passthrough()).optional(),
  assets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    thumbnailURL: z.string().url(),
    videoQualities: z.array(z.object({
      quality: z.string(),
      sourceURL: z.string().url(),
      frameRate: z.number().optional(),
    }).passthrough()),
  }).passthrough()).optional(),
}).passthrough();

export type ScrapCreatorsClip = z.infer<typeof ScrapCreatorsClipSchema>;

// API Response wrapper
export const ScrapCreatorsResponseSchema = z.object({
  '0': z.object({
    data: z.object({
      clip: ScrapCreatorsClipSchema,
    }).passthrough(),
  }).passthrough(),
  success: z.boolean(),
  credits_remaining: z.number().optional(),
}).passthrough();

export type ScrapCreatorsResponse = z.infer<typeof ScrapCreatorsResponseSchema>;

// Processed clip data for internal use
export interface ProcessedClip {
  id: string;
  slug: string;
  title: string;
  duration: number;
  broadcaster: string;
  broadcasterLogin: string;
  game: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  quality: VideoQuality;
  createdAt: Date;
}

// Import request schema
export const ImportClipRequestSchema = z.object({
  clipUrl: z.string().url().refine(
    (url) => url.includes('twitch.tv') || url.includes('clips.twitch.tv'),
    { message: 'Must be a valid Twitch clip URL' }
  ),
  quality: z.enum(['1080', '720', '480', '360']).optional().default('1080'),
});

export type ImportClipRequest = z.infer<typeof ImportClipRequestSchema>;

// Import result
export interface ClipImportResult {
  clipId: string;
  title: string;
  duration: number;
  broadcaster: string;
  driveFileId: string;
  driveUrl: string;
  folder: string;
  localPath?: string;
}
