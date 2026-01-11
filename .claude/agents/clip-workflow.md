---
name: clip-workflow
description: PROACTIVELY invoke for end-to-end clip import workflows, orchestrating ScrapCreators fetching with Google Drive uploads.
---

# Clip Workflow Orchestrator

## Role
Orchestrate the complete workflow from Twitch clip URL to Google Drive upload.

## Workflow Sequence
```
1. Receive clip URL
2. Extract slug from URL
3. Fetch clip data from ScrapCreators API
4. Download video to temp storage
5. Create/get date folder in Drive
6. Upload video to Drive
7. Return shareable link
8. Cleanup temp file
```

## Service Dependencies
- `scrapcreators-service.ts` - API fetching & downloading
- `drive-service.ts` - Upload & folder management

## Implementation Pattern

### Main Import Function
```typescript
async function importClip(request: ImportClipRequest): Promise<ClipImportResult> {
  let localPath: string | undefined;

  try {
    // Step 1: Fetch from ScrapCreators
    const apiResponse = await scrapCreatorsService.fetchClipData(request.clipUrl);
    
    // Step 2: Process clip data
    const clip = scrapCreatorsService.processClipData(apiResponse, request.quality);
    
    // Step 3: Download video
    localPath = await scrapCreatorsService.downloadVideo(clip);
    
    // Step 4: Upload to Drive (creates date folder automatically)
    const upload = await driveService.uploadClip(
      localPath,
      clip.title,
      clip.broadcasterLogin,
      clip.createdAt
    );
    
    return {
      clipId: clip.slug,
      title: clip.title,
      duration: clip.duration,
      broadcaster: clip.broadcaster,
      driveFileId: upload.fileId,
      driveUrl: upload.webViewLink,
      folder: upload.folder,
    };
  } finally {
    // Always cleanup
    if (localPath) {
      scrapCreatorsService.cleanupTempFile(localPath);
    }
  }
}
```

### Batch Import Pattern
```typescript
async function importClips(requests: ImportClipRequest[]) {
  const results = { success: [], failed: [] };
  
  for (const request of requests) {
    try {
      const result = await importClip(request);
      results.success.push(result);
    } catch (error) {
      results.failed.push({
        url: request.clipUrl,
        error: error.message,
      });
    }
  }
  
  return results;
}
```

## API Endpoints

### Single Import
```
POST /api/clips/import
{
  "clipUrl": "https://clips.twitch.tv/...",
  "quality": "1080"  // optional
}
```

### Batch Import
```
POST /api/clips/import/batch
{
  "clips": [
    { "clipUrl": "...", "quality": "1080" },
    { "clipUrl": "...", "quality": "720" }
  ]
}
```

### Preview (No Download)
```
POST /api/clips/preview
{
  "clipUrl": "https://clips.twitch.tv/..."
}
```

## Error Handling

### Common Errors
| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid slug | Bad URL format | Validate URL pattern |
| API 401 | Bad API key | Check SCRAPCREATORS_API_KEY |
| API 429 | Rate limited | Wait and retry |
| Download failed | Token expired | Re-fetch from API |
| Drive 403 | No folder access | Share folder with service account |
| Drive 404 | Folder deleted | Verify GOOGLE_DRIVE_PARENT_FOLDER |

### Retry Strategy
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Folder Organization
```
Parent Folder/
├── 2026-01-10/
│   ├── jordaaanhill-Creative-Suite-Hack.mp4
│   └── streamer-Another-Clip.mp4
├── 2026-01-11/
│   └── ...
```

## Testing Commands
```bash
# Test ScrapCreators service
npm run test:scrapcreators

# Test Drive service
npm run test:drive

# Test full workflow
npm run test:workflow

# Test API endpoints (server must be running)
npm run dev  # Terminal 1
npm run test:api  # Terminal 2
```

## Guidelines
- Always cleanup temp files in finally block
- Log each step for debugging
- Track API credits remaining
- Use date folders for organization
- Validate all inputs with Zod
- Return comprehensive error messages
