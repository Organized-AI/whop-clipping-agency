# Phase 7: Instagram Auto-Post

## Objective
Automatically post clips to Instagram Reels after they're imported to Google Drive, enabling seamless content distribution from Twitch/YouTube to Instagram.

---

## Prerequisites
- V1 clip import pipeline complete (Phases 0-5)
- Instagram Business Account (not Personal or Creator)
- Facebook Developer App with Instagram Graph API
- Clips stored in Google Drive with public sharing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Instagram Auto-Post Pipeline                  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CLIP IMPORT    │  │  VIDEO PREP     │  │  INSTAGRAM      │
│  (V1 Pipeline)  │  │                 │  │  GRAPH API      │
│                 │  │ • 9:16 aspect   │  │                 │
│ • Twitch clips  │  │ • MP4 format    │  │ • Auth flow     │
│ • YouTube clips │  │ • Public URL    │  │ • Container     │
│ • VOD detection │  │ • Caption gen   │  │ • Publish       │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │   POSTED TO INSTAGRAM   │
                 │   REELS                 │
                 └─────────────────────────┘
```

---

## Requirements

### Instagram Business Account Setup
1. Convert Instagram account to Business (free in app settings)
2. Link to Facebook Page (required for API access)
3. Note the Instagram Business Account ID

### Facebook Developer App Setup
1. Go to https://developers.facebook.com
2. Create new app → Select "Business" type
3. Add products:
   - Facebook Login
   - Instagram Graph API
4. Configure OAuth redirect URI
5. Get App ID and App Secret

### Required Permissions
```
instagram_basic
instagram_content_publish
pages_read_engagement
pages_show_list
```

---

## Tasks

### Task 1: Environment Configuration

Add to `.env`:
```env
# Instagram Graph API
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_ig_account_id
```

### Task 2: Instagram Types

Create `src/types/instagram.ts`:

```typescript
import { z } from 'zod';

export interface InstagramPostRequest {
  videoUrl: string;           // Public URL (Google Drive direct link)
  caption: string;            // Post caption with hashtags
  shareToFeed?: boolean;      // Also show in main feed (default: true)
  coverImageUrl?: string;     // Optional thumbnail
  coverImageOffset?: number;  // Offset in ms for auto-thumbnail
}

export interface InstagramPostResult {
  success: boolean;
  mediaId?: string;
  permalink?: string;
  error?: string;
}

export interface InstagramContainerStatus {
  id: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  statusCode?: string;
}

export const InstagramPostRequestSchema = z.object({
  videoUrl: z.string().url(),
  caption: z.string().max(2200),
  shareToFeed: z.boolean().optional().default(true),
  coverImageUrl: z.string().url().optional(),
  coverImageOffset: z.number().optional(),
});

// Video requirements from Instagram
export const INSTAGRAM_VIDEO_REQUIREMENTS = {
  container: ['MOV', 'MP4'],
  aspectRatio: { min: 0.01, max: 10, recommended: 9/16 },
  frameRate: { min: 23, max: 60 },
  maxDuration: 90, // seconds (some accounts may have 60s limit)
  maxFileSize: 1024 * 1024 * 1024, // 1GB
};
```

### Task 3: Instagram Service

Create `src/services/instagram-service.ts`:

```typescript
import { clipsConfig } from '../config/clips-config';
import {
  InstagramPostRequest,
  InstagramPostResult,
  InstagramContainerStatus,
} from '../types/instagram';

export class InstagramService {
  private accessToken: string;
  private accountId: string;
  private apiVersion = 'v18.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';

    if (!this.accessToken || !this.accountId) {
      console.warn('Instagram credentials not configured');
    }
  }

  /**
   * Post a Reel to Instagram
   * Two-step process: Create container → Publish
   */
  async postReel(request: InstagramPostRequest): Promise<InstagramPostResult> {
    try {
      console.log('\n📸 Posting to Instagram Reels...');
      console.log(`Caption: ${request.caption.slice(0, 50)}...`);

      // Step 1: Create media container
      const containerId = await this.createMediaContainer(request);
      console.log(`Container created: ${containerId}`);

      // Step 2: Wait for processing
      console.log('Waiting for Instagram to process video...');
      await this.waitForProcessing(containerId);

      // Step 3: Publish
      const result = await this.publishContainer(containerId);
      console.log(`✅ Posted! Media ID: ${result.mediaId}`);

      return result;
    } catch (error: any) {
      console.error('Instagram post failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Step 1: Create media container
   */
  private async createMediaContainer(request: InstagramPostRequest): Promise<string> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.accountId}/media`;

    const params: Record<string, any> = {
      media_type: 'REELS',
      video_url: request.videoUrl,
      caption: request.caption,
      share_to_feed: request.shareToFeed ?? true,
      access_token: this.accessToken,
    };

    if (request.coverImageUrl) {
      params.thumb_url = request.coverImageUrl;
    } else if (request.coverImageOffset) {
      params.thumb_offset = request.coverImageOffset;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.id;
  }

  /**
   * Step 2: Wait for video processing
   */
  private async waitForProcessing(
    containerId: string,
    maxAttempts = 30,
    intervalMs = 5000
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getContainerStatus(containerId);

      if (status.status === 'FINISHED') {
        return;
      }

      if (status.status === 'ERROR') {
        throw new Error(`Processing failed: ${status.statusCode}`);
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Video processing timeout');
  }

  /**
   * Check container processing status
   */
  private async getContainerStatus(containerId: string): Promise<InstagramContainerStatus> {
    const url = `${this.baseUrl}/${this.apiVersion}/${containerId}`;
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: this.accessToken,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    // Map status_code to our status enum
    let status: InstagramContainerStatus['status'] = 'IN_PROGRESS';
    if (data.status_code === 'FINISHED') {
      status = 'FINISHED';
    } else if (data.status_code === 'ERROR') {
      status = 'ERROR';
    }

    return {
      id: containerId,
      status,
      statusCode: data.status_code,
    };
  }

  /**
   * Step 3: Publish the container
   */
  private async publishContainer(containerId: string): Promise<InstagramPostResult> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.accountId}/media_publish`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: this.accessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Get permalink for the posted media
    const permalink = await this.getMediaPermalink(data.id);

    return {
      success: true,
      mediaId: data.id,
      permalink,
    };
  }

  /**
   * Get permalink for posted media
   */
  private async getMediaPermalink(mediaId: string): Promise<string | undefined> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${mediaId}`;
      const params = new URLSearchParams({
        fields: 'permalink',
        access_token: this.accessToken,
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      return data.permalink;
    } catch {
      return undefined;
    }
  }

  /**
   * Convert Google Drive file to direct download URL
   */
  static getDriveDirectUrl(driveFileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  }

  /**
   * Generate caption with hashtags
   */
  static generateCaption(
    title: string,
    streamer?: string,
    customHashtags?: string[]
  ): string {
    const defaultHashtags = ['#twitch', '#gaming', '#clips', '#streamer'];
    const hashtags = customHashtags || defaultHashtags;

    let caption = title;
    if (streamer) {
      caption += `\n\n🎮 @${streamer}`;
    }
    caption += `\n\n${hashtags.join(' ')}`;

    return caption;
  }
}

export const instagramService = new InstagramService();
```

### Task 4: Instagram Workflow Integration

Create `src/services/instagram-workflow.ts`:

```typescript
import { instagramService, InstagramService } from './instagram-service';
import { driveService } from './drive-service';
import { ClipResult } from '../types/clips';
import { InstagramPostResult } from '../types/instagram';

export class InstagramWorkflowService {
  /**
   * Post a clip to Instagram after it's been imported to Drive
   */
  async postClipToInstagram(
    clipResult: ClipResult,
    customCaption?: string
  ): Promise<InstagramPostResult> {
    // Ensure the Drive file is publicly accessible
    await driveService.makeFilePublic(clipResult.driveFileId);

    // Get direct URL
    const videoUrl = InstagramService.getDriveDirectUrl(clipResult.driveFileId);

    // Generate caption
    const caption = customCaption || InstagramService.generateCaption(
      clipResult.title,
      clipResult.broadcaster,
      ['#twitch', '#clips', '#gaming', '#live']
    );

    // Post to Instagram
    return instagramService.postReel({
      videoUrl,
      caption,
      shareToFeed: true,
    });
  }

  /**
   * Full workflow: Import clip → Post to Instagram
   */
  async importAndPost(
    clipUrl: string,
    instagramCaption?: string
  ): Promise<{
    clipResult: ClipResult;
    instagramResult: InstagramPostResult;
  }> {
    // Import clip using existing workflow
    const { clipWorkflowService } = await import('./clip-workflow');
    const clipResult = await clipWorkflowService.importClip({ clipUrl });

    // Post to Instagram
    const instagramResult = await this.postClipToInstagram(
      clipResult,
      instagramCaption
    );

    return { clipResult, instagramResult };
  }
}

export const instagramWorkflowService = new InstagramWorkflowService();
```

### Task 5: Instagram API Routes

Create `src/api/instagram.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { instagramService } from '../services/instagram-service';
import { instagramWorkflowService } from '../services/instagram-workflow';
import { InstagramPostRequestSchema } from '../types/instagram';

const router = Router();

/**
 * POST /api/instagram/post
 * Post a video URL directly to Instagram Reels
 */
router.post('/post', async (req: Request, res: Response) => {
  try {
    const parseResult = InstagramPostRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten(),
        },
      });
    }

    const result = await instagramService.postReel(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Instagram post error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'POST_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/instagram/import-and-post
 * Import a Twitch clip AND post to Instagram
 */
router.post('/import-and-post', async (req: Request, res: Response) => {
  try {
    const { clipUrl, caption } = req.body;

    if (!clipUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'clipUrl is required',
        },
      });
    }

    const result = await instagramWorkflowService.importAndPost(clipUrl, caption);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Import and post error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_POST_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/instagram/post-from-drive
 * Post an existing Drive file to Instagram
 */
router.post('/post-from-drive', async (req: Request, res: Response) => {
  try {
    const { driveFileId, caption } = req.body;

    if (!driveFileId || !caption) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'driveFileId and caption are required',
        },
      });
    }

    const { InstagramService } = await import('../services/instagram-service');
    const videoUrl = InstagramService.getDriveDirectUrl(driveFileId);

    const result = await instagramService.postReel({
      videoUrl,
      caption,
      shareToFeed: true,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Post from Drive error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'POST_FROM_DRIVE_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
```

### Task 6: OAuth Token Management

Create `src/services/instagram-auth.ts`:

```typescript
/**
 * Instagram OAuth Token Management
 * 
 * Instagram access tokens expire and need to be refreshed.
 * Short-lived tokens: 1 hour
 * Long-lived tokens: 60 days
 * 
 * For production, implement token refresh logic.
 */

export class InstagramAuthService {
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://graph.facebook.com';

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    const url = `${this.baseUrl}/oauth/access_token`;
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.access_token;
  }

  /**
   * Refresh a long-lived token before it expires
   */
  async refreshToken(token: string): Promise<string> {
    const url = `${this.baseUrl}/oauth/access_token`;
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: token,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.access_token;
  }

  /**
   * Get Instagram Business Account ID from Facebook Page
   */
  async getInstagramAccountId(
    pageId: string,
    accessToken: string
  ): Promise<string> {
    const url = `${this.baseUrl}/${pageId}`;
    const params = new URLSearchParams({
      fields: 'instagram_business_account',
      access_token: accessToken,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.instagram_business_account?.id;
  }
}

export const instagramAuthService = new InstagramAuthService();
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/instagram/post` | Post video URL to Instagram Reels |
| POST | `/api/instagram/import-and-post` | Import Twitch clip → Post to Instagram |
| POST | `/api/instagram/post-from-drive` | Post existing Drive file to Instagram |

---

## Example Requests

### Post Video URL
```bash
curl -X POST http://localhost:3000/api/instagram/post \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://drive.google.com/uc?export=download&id=FILE_ID",
    "caption": "Check out this epic moment! 🎮\n\n#twitch #gaming #clips",
    "shareToFeed": true
  }'
```

### Import and Post
```bash
curl -X POST http://localhost:3000/api/instagram/import-and-post \
  -H "Content-Type: application/json" \
  -d '{
    "clipUrl": "https://clips.twitch.tv/ExampleClip",
    "caption": "Just clipped this! 🔥\n\n#twitch #streamer"
  }'
```

---

## Video Requirements

| Requirement | Value |
|-------------|-------|
| Format | MP4 (MPEG-4 Part 14) |
| Aspect Ratio | 9:16 recommended (0.01:1 to 10:1 supported) |
| Frame Rate | 23-60 FPS |
| Duration | Up to 90 seconds (some accounts: 60s) |
| File Size | Up to 1GB |
| Audio | AAC, 48kHz max |
| Video Codec | H264 or HEVC |

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Posts per day | 25 (Business accounts) |
| API calls per hour | 200 |
| Container creation | No specific limit |

---

## Considerations

### Aspect Ratio Conversion
Twitch clips are 16:9, Instagram Reels prefer 9:16. Options:
1. Letterbox (add black bars)
2. Crop center
3. Use facecam overlay layout
4. Keep 16:9 (Instagram allows, but less optimal)

### Scheduling
Instagram API supports immediate posting only. For scheduling:
- Use a job queue (Bull, Agenda)
- Store scheduled posts in database
- Run cron job to process queue

### Caption Generation
Consider adding:
- Streamer mention (@username)
- Game hashtags (#Valorant, #Fortnite)
- Custom client branding
- Call-to-action links

---

## Success Criteria

- [ ] Facebook Developer App configured
- [ ] Instagram Business Account connected
- [ ] Access token stored securely
- [ ] `POST /api/instagram/post` returns media ID
- [ ] `POST /api/instagram/import-and-post` completes full workflow
- [ ] Posted Reels visible on Instagram

---

## Git Commit

```bash
git add -A
git commit -m "V2 Phase 7: Instagram auto-post integration"
```
