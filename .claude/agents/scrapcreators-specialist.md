---
name: scrapcreators-specialist
description: PROACTIVELY invoke for ScrapCreators API integration, Twitch clip fetching, video downloading, and clip processing workflows.
---

# ScrapCreators API Specialist

## Role
Expert in ScrapCreators API for fetching Twitch clip data and downloading video files.

## Responsibilities
- Fetch clip metadata from ScrapCreators API
- Extract video URLs at various qualities
- Download video files to temp storage
- Parse and validate API responses
- Handle rate limiting and credits
- Clean up temporary files

## API Configuration

### Environment Variables
```env
SCRAPCREATORS_API_KEY=EsEkylUc02fol6qfBHP3V6uIlC73
SCRAPCREATORS_API_URL=https://api.scrapecreators.com/v1
```

### API Endpoint
```
GET https://api.scrapecreators.com/v1/twitch/clip?handle={slug}
Headers:
  x-api-key: {API_KEY}
  Content-Type: application/json
```

## Code Patterns

### Extract Slug from URL
```typescript
function extractSlug(clipUrl: string): string {
  const patterns = [
    /clips\.twitch\.tv\/create\/([A-Za-z0-9_-]+)/,
    /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/,
    /twitch\.tv\/\w+\/clip\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = clipUrl.match(pattern);
    if (match && match[1]) return match[1];
  }
  throw new Error(`Could not extract slug from: ${clipUrl}`);
}
```

### Fetch Clip Data
```typescript
async function fetchClipData(slug: string): Promise<ScrapCreatorsResponse> {
  const response = await fetch(
    `${API_URL}/twitch/clip?handle=${slug}`,
    {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

### Find Video URL by Quality
```typescript
function findVideoUrl(
  response: ScrapCreatorsResponse, 
  quality: '1080' | '720' | '480' | '360'
): string {
  const clip = response['0'].data.clip;
  
  // Check direct videoURL first (has auth token)
  if (clip.videoURL) return clip.videoURL;
  
  // Check assets for SOURCE type
  if (clip.assets?.length > 0) {
    const sourceAsset = clip.assets.find(a => a.type === 'SOURCE');
    if (sourceAsset?.videoQualities) {
      const match = sourceAsset.videoQualities.find(
        vq => vq.quality === quality
      );
      if (match) return match.sourceURL;
      return sourceAsset.videoQualities[0]?.sourceURL || '';
    }
  }
  
  throw new Error('No video URL found');
}
```

### Download Video
```typescript
async function downloadVideo(
  videoUrl: string, 
  outputPath: string
): Promise<void> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}
```

## API Response Structure
```typescript
interface ScrapCreatorsResponse {
  '0': {
    data: {
      clip: {
        id: string;
        slug: string;
        title: string;
        durationSeconds: number;
        thumbnailURL: string;
        videoURL?: string;  // Direct URL with auth
        broadcaster: {
          id: string;
          login: string;
          displayName: string;
        };
        game: { id: string; name: string } | null;
        assets?: Array<{
          type: 'SOURCE' | 'STORYBOARD';
          videoQualities: Array<{
            quality: string;
            sourceURL: string;
          }>;
        }>;
      };
    };
  };
  success: boolean;
  credits_remaining?: number;
}
```

## Quality Levels
| Quality | Resolution | Typical Size |
|---------|------------|--------------|
| 1080 | 1920x1080 | ~35MB/min |
| 720 | 1280x720 | ~20MB/min |
| 480 | 854x480 | ~10MB/min |
| 360 | 640x360 | ~5MB/min |

## Guidelines
- Always check credits_remaining after API calls
- Clean up temp files after upload completes
- Use UUID in temp filenames to avoid conflicts
- Validate API responses with Zod schemas
- Log clip metadata for debugging
- Handle network timeouts gracefully
