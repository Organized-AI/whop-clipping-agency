---
name: import-clip
description: Import a Twitch clip to Google Drive
arguments:
  - name: url
    description: Twitch clip URL
    required: true
  - name: quality
    description: Video quality (1080, 720, 480, 360)
    required: false
---

# Import Clip Command

Import a Twitch clip directly to Google Drive.

## Usage
```
/import-clip <url> [quality]
```

## Examples
```
/import-clip https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4
/import-clip https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4 720
```

## Execution Steps

1. **Validate URL**
   - Check URL contains twitch.tv or clips.twitch.tv
   - Extract clip slug from URL

2. **Fetch Clip Data**
   ```bash
   npm run test:scrapcreators
   ```
   Or test manually in the service

3. **Run Import**
   If server is running:
   ```bash
   curl -X POST http://localhost:3000/api/clips/import \
     -H "Content-Type: application/json" \
     -d '{"clipUrl": "$url", "quality": "${quality:-1080}"}'
   ```
   
   Or run workflow directly:
   ```bash
   npx tsx -e "
   import { clipWorkflowService } from './src/services/clip-workflow';
   clipWorkflowService.importClip({
     clipUrl: '$url',
     quality: '${quality:-1080}'
   }).then(console.log).catch(console.error);
   "
   ```

4. **Output**
   - Clip title and duration
   - Google Drive file ID
   - Shareable link
   - Folder name (date)

## Error Handling
- Invalid URL → Show URL format examples
- API error → Check ScrapCreators credits
- Drive error → Verify service account has folder access
