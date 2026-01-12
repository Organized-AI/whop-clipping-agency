import { z } from 'zod';

// Clip types specific to dev streams
export type DevStreamClipType =
  | 'explanation'    // Teaching a concept
  | 'build_moment'   // Terminal output, builds, tests
  | 'aha_moment'     // Realization or discovery
  | 'demo'           // Explaining while coding
  | 'intro'          // Stream/topic introduction
  | 'summary';       // Wrapping up a concept

// Transcript segment from ScrapCreators
export interface TranscriptSegment {
  text: string;
  startTime: number;  // seconds
  endTime: number;
  confidence?: number;
}

// Scored moment from any analyzer
export interface ScoredMoment {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  source: 'transcript' | 'motion' | 'audio';
}

// Motion analysis segment
export interface MotionSegment {
  startTime: number;
  endTime: number;
  motionScore: number;  // 0-100
  activityLevel: 'high' | 'medium' | 'low';
  sceneChanges: number;
}

// Audio analysis segment
export interface AudioSegment {
  startTime: number;
  endTime: number;
  speechRatio: number;      // 0-1
  averageVolume: number;    // dB
  volumeVariance: number;
  silenceBeforeSpike: boolean;
}

// Combined highlight after signal fusion
export interface DetectedHighlight {
  startTime: number;
  endTime: number;
  duration: number;
  totalScore: number;
  signals: {
    transcript: number;
    motion: number;
    audio: number;
  };
  clipType: DevStreamClipType;
  reason: string;
  confidence: number;  // 0-1
}

// Options interface for highlight detection (with defaults)
export interface DetectHighlightsOptions {
  maxClips?: number;
  minScore?: number;
  preferTypes?: DevStreamClipType[];
  analysisQuality?: '720' | '480';
  skipMotionAnalysis?: boolean;
}

// API request/response schemas
export const DetectHighlightsRequestSchema = z.object({
  vodUrl: z.string().url(),
  options: z.object({
    maxClips: z.number().min(1).max(20).optional(),
    minScore: z.number().min(0).optional(),
    preferTypes: z.array(z.enum([
      'explanation', 'build_moment', 'aha_moment', 'demo', 'intro', 'summary'
    ])).optional(),
    analysisQuality: z.enum(['720', '480']).optional(),
    skipMotionAnalysis: z.boolean().optional(),
  }).optional(),
});

export interface DetectHighlightsRequest {
  vodUrl: string;
  options?: DetectHighlightsOptions;
}

export interface DetectHighlightsResponse {
  vodId: string;
  vodTitle: string;
  vodDuration: number;
  analysisTime: number;
  highlights: DetectedHighlight[];
}

// Combined detect-and-extract request
export const DetectAndExtractRequestSchema = z.object({
  vodUrl: z.string().url(),
  maxClips: z.number().min(1).max(20).optional().default(10),
  minScore: z.number().min(0).optional().default(3),
  quality: z.enum(['2160', '1440', '1080', '720', '480']).optional().default('1080'),
});

export interface DetectAndExtractRequest {
  vodUrl: string;
  maxClips?: number;
  minScore?: number;
  quality?: '2160' | '1440' | '1080' | '720' | '480';
}

// Multi-clip extraction request
export const ExtractClipsRequestSchema = z.object({
  vodUrl: z.string().url(),
  clips: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
  })).min(1).max(50),
  quality: z.enum(['2160', '1440', '1080', '720', '480']).optional(),
  parallelUploads: z.boolean().optional(),
});

export interface ExtractClipsRequest {
  vodUrl: string;
  clips: Array<{
    startTime: string;
    endTime: string;
    name?: string;
    type?: string;
  }>;
  quality?: '2160' | '1440' | '1080' | '720' | '480';
  parallelUploads?: boolean;
}

export interface ExtractedClip {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  driveFileId: string;
  driveUrl: string;
  folder: string;
}

export interface ExtractClipsResponse {
  vodId: string;
  vodTitle: string;
  totalClips: number;
  successful: number;
  failed: number;
  clips: ExtractedClip[];
  errors?: Array<{ clip: string; error: string }>;
  processingTime: number;
}
