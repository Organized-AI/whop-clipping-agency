# Phase 4: YouTube Clip Import - Claude Code Prompt

## Quick Execute

```bash
cd "/Users/supabowl/Library/Mobile Documents/com~apple~CloudDocs/BHT Promo iCloud/Organized AI/Windsurf/whop-clipping-agency"
claude --dangerously-skip-permissions
```

Then paste this prompt:

---

## Phase 4a: Core YouTube Service (COMPLETE ✅)

The following has been implemented:
- `src/types/youtube.ts` - TypeScript types and Zod schemas
- `src/services/youtube-service.ts` - yt-dlp integration for downloads
- `src/services/youtube-workflow.ts` - Full pipeline orchestration
- `scripts/test-youtube.ts` - Test suite
- `scripts/import-youtube-clip.ts` - CLI import tool

Run `npm run test:youtube` to verify.

---

## Phase 4b: YouTube API Routes (TO DO)

Execute the following:

1. Create `src/api/youtube.ts` with these endpoints:
   - POST `/api/youtube/import` - Import clip with timestamps
   - POST `/api/youtube/import/batch` - Multiple clips from one video
   - POST `/api/youtube/import/chapter` - Import by chapter name
   - POST `/api/youtube/preview` - Get video metadata
   - POST `/api/youtube/chapters` - List video chapters
   - POST `/api/youtube/transcript` - Get transcript

2. Update `src/index.ts` to include the YouTube router

3. Create `scripts/test-youtube-api.ts` for API testing

4. Run verification:
   ```bash
   npm run typecheck
   npm run dev  # Terminal 1
   npm run test:youtube:api  # Terminal 2
   ```

5. Commit:
   ```bash
   git add -A
   git commit -m "Phase 4b: YouTube API routes"
   git push origin main
   ```

Read `PLANNING/implementation-phases/PHASE-4-YOUTUBE.md` for full implementation details.

---

## Verification Checklist

After completion:
- [ ] `npm run typecheck` passes
- [ ] `npm run test:youtube` passes
- [ ] Server starts with `npm run dev`
- [ ] `POST /api/youtube/preview` returns video metadata
- [ ] `POST /api/youtube/import` downloads clip and uploads to Drive
- [ ] Clip appears in Google Drive date folder

---

## Test Commands

```bash
# Test core service
npm run test:youtube

# Test API endpoints (server must be running)
curl -X POST http://localhost:3000/api/youtube/preview \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=jNQXAC9IVRw"}'

curl -X POST http://localhost:3000/api/youtube/import \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=jNQXAC9IVRw",
    "startTime": "0:00",
    "endTime": "0:05",
    "quality": "720"
  }'
```
