import { config } from 'dotenv';
import { z } from 'zod';
import * as os from 'os';
import * as path from 'path';

config();

const ClipsConfigSchema = z.object({
  scrapcreators: z.object({
    apiKey: z.string().min(1, 'SCRAPCREATORS_API_KEY required'),
    apiUrl: z.string().url().default('https://api.scrapecreators.com/v1'),
  }),
  googleDrive: z.object({
    parentFolderId: z.string().min(1, 'GOOGLE_DRIVE_PARENT_FOLDER required'),
    serviceAccountPath: z.string().default('./config/service-account.json'),
  }),
  clips: z.object({
    defaultQuality: z.enum(['1080', '720', '480', '360']).default('1080'),
    tempDownloadPath: z.string().default('./temp'),
  }),
});

export type ClipsConfig = z.infer<typeof ClipsConfigSchema>;

export function loadClipsConfig(): ClipsConfig {
  const rawConfig = {
    scrapcreators: {
      apiKey: process.env.SCRAPCREATORS_API_KEY || '',
      apiUrl: process.env.SCRAPCREATORS_API_URL,
    },
    googleDrive: {
      parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER || '',
      serviceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
    },
    clips: {
      defaultQuality: process.env.DEFAULT_CLIP_QUALITY as '1080' | '720' | '480' | '360',
      tempDownloadPath: process.env.TEMP_DOWNLOAD_PATH,
    },
  };

  return ClipsConfigSchema.parse(rawConfig);
}

export const clipsConfig = loadClipsConfig();

/**
 * Get cross-platform temp directory for clip processing
 * Uses TEMP_DOWNLOAD_PATH env var if set, otherwise system temp dir
 */
export const getTempDir = (): string => {
  const configuredPath = process.env.TEMP_DOWNLOAD_PATH;
  if (configuredPath) {
    return path.resolve(configuredPath);
  }
  return path.join(os.tmpdir(), 'whop-clipping-agency');
};
