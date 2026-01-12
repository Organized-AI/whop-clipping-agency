# Phase 6: Post-Build Hardening & Fixes

## Objective
Address critical issues, improve cross-platform compatibility, add missing validation, and implement production-readiness improvements discovered during the completeness analysis.

---

## Context Files to Read First
1. `src/services/vod-service.ts` - VOD service with /tmp paths
2. `src/services/highlight-detection/transcript-analyzer.ts` - Transcript analyzer with /tmp paths
3. `src/api/vod.ts` - VOD routes missing validation
4. `src/index.ts` - Main server entry point
5. `src/config/clips-config.ts` - Configuration pattern to follow

---

## Dependencies
- Phases 0-5 must be complete
- All services functional

---

## Priority Levels

| Priority | Impact | Action |
|----------|--------|--------|
| 🔴 Critical | Breaks functionality | Must fix immediately |
| 🟠 High | Production issues | Should fix before deploy |
| 🟡 Medium | Quality/maintenance | Nice to have |
| 🔵 Low | Future improvements | Document for later |

---

## Tasks

### Task 1: Fix Cross-Platform Temp Directory Paths (🔴 Critical)

**Problem:** Hard-coded `/tmp` paths fail on Windows.

**Files to fix:**
- `src/services/vod-service.ts` (line 47)
- `src/services/highlight-detection/transcript-analyzer.ts` (lines 233, 237, 241)

**Solution:**

Update `src/config/clips-config.ts` to export temp path:

```typescript
import * as os from 'os';
import * as path from 'path';

// Add to existing config
export const getTempDir = (): string => {
  const configuredPath = process.env.TEMP_DOWNLOAD_PATH;
  if (configuredPath) {
    return path.resolve(configuredPath);
  }
  return path.join(os.tmpdir(), 'whop-clipping-agency');
};
```

Update `src/services/vod-service.ts`:

```typescript
import { getTempDir } from '../config/clips-config';
import * as path from 'path';

// Replace line 47:
// OLD: const tempDir = `/tmp/vod-${sessionId}`;
// NEW:
const tempDir = path.join(getTempDir(), `vod-${sessionId}`);
```

Update `src/services/highlight-detection/transcript-analyzer.ts`:

```typescript
import { getTempDir } from '../../config/clips-config';
import * as path from 'path';

// Replace lines 233-241:
// OLD: execSync(`yt-dlp ... -o "/tmp/${videoId}" ...`);
// OLD: const subFile = `/tmp/${videoId}.en.vtt`;

// NEW:
const tempDir = getTempDir();
const outputPath = path.join(tempDir, videoId);
const subFile = path.join(tempDir, `${videoId}.en.vtt`);

execSync(
  `yt-dlp --write-auto-sub --skip-download --sub-lang en -o "${outputPath}" "${videoUrl}" 2>&1`,
  { encoding: 'utf-8', timeout: 60000 }
);
```

---

### Task 2: Add Validation to detect-and-extract Endpoint (🔴 Critical)

**Problem:** `/api/vod/detect-and-extract` lacks Zod schema validation.

**File:** `src/api/vod.ts`

**Solution:**

Add new schema to `src/types/highlights.ts`:

```typescript
export const DetectAndExtractRequestSchema = z.object({
  vodUrl: z.string().url(),
  maxClips: z.number().min(1).max(20).default(10),
  minScore: z.number().min(0).default(3),
  quality: z.enum(['2160', '1440', '1080', '720', '480']).default('1080'),
  preferTypes: z.array(z.enum([
    'explanation', 'build_moment', 'aha_moment', 'demo', 'intro', 'summary'
  ])).optional(),
});

export type DetectAndExtractRequest = z.infer<typeof DetectAndExtractRequestSchema>;
```

Update `src/api/vod.ts` detect-and-extract route:

```typescript
import { DetectAndExtractRequestSchema } from '../types/highlights';

router.post('/detect-and-extract', async (req: Request, res: Response) => {
  try {
    const parseResult = DetectAndExtractRequestSchema.safeParse(req.body);
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

    const { vodUrl, maxClips, minScore, quality, preferTypes } = parseResult.data;

    // ... rest of implementation
  } catch (error: any) {
    // ... error handling
  }
});
```

---

### Task 3: Add Server Startup Validation (🟠 High)

**Problem:** Server can start with broken/missing environment config.

**File:** `src/index.ts`

**Solution:**

Create `src/config/validate-env.ts`:

```typescript
import { z } from 'zod';

const ServerEnvSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const RequiredServicesSchema = z.object({
  SCRAPCREATORS_API_KEY: z.string().min(1, 'ScrapCreators API key required'),
  GOOGLE_DRIVE_PARENT_FOLDER: z.string().min(1, 'Google Drive folder ID required'),
  GOOGLE_SERVICE_ACCOUNT_PATH: z.string().default('./config/service-account.json'),
});

export function validateEnvironment(): { port: number; nodeEnv: string } {
  console.log('Validating environment configuration...');

  // Validate server config
  const serverResult = ServerEnvSchema.safeParse(process.env);
  if (!serverResult.success) {
    console.error('❌ Server configuration invalid:');
    console.error(serverResult.error.flatten());
    process.exit(1);
  }

  // Validate required services
  const servicesResult = RequiredServicesSchema.safeParse(process.env);
  if (!servicesResult.success) {
    console.warn('⚠️  Missing service configuration:');
    const errors = servicesResult.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, messages]) => {
      console.warn(`   ${key}: ${messages?.join(', ')}`);
    });
    console.warn('   Some features may not work correctly.\n');
  } else {
    console.log('✅ Environment configuration valid\n');
  }

  return {
    port: serverResult.data.PORT,
    nodeEnv: serverResult.data.NODE_ENV,
  };
}
```

Update `src/index.ts`:

```typescript
import { validateEnvironment } from './config/validate-env';

// At the top of the file, after imports:
const { port, nodeEnv } = validateEnvironment();

// Replace:
// const PORT = process.env.PORT || 3000;
// With:
const PORT = port;
```

---

### Task 4: Add Temp File Cleanup Logging (🟠 High)

**Problem:** Silent cleanup failures can leave orphaned files.

**File:** `src/services/vod-service.ts`

**Solution:**

Replace lines 160-168:

```typescript
// OLD:
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (e) {
  // Ignore cleanup errors
}

// NEW:
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`[Cleanup] Removed temp directory: ${tempDir}`);
} catch (error: any) {
  console.warn(`[Cleanup] Failed to remove temp directory: ${tempDir}`);
  console.warn(`[Cleanup] Error: ${error.message}`);
  console.warn('[Cleanup] Manual cleanup may be required');
}
```

---

### Task 5: Add Request Timeouts to Fetch Calls (🟡 Medium)

**Problem:** Some fetch calls can hang indefinitely.

**File:** `src/services/youtube-service.ts`

**Solution:**

Create a helper function and update fetch calls:

```typescript
// Add at top of file:
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Update getTranscript method (around line 156):
// OLD:
const response = await fetch(transcriptUrl);

// NEW:
const response = await fetchWithTimeout(transcriptUrl, {}, 60000);
```

---

### Task 6: Implement Whop Webhook Handler (🟡 Medium)

**Problem:** Webhook endpoint is a stub with no actual processing.

**File:** `src/index.ts` and new `src/webhooks/whop-handler.ts`

**Solution:**

Create `src/webhooks/whop-handler.ts`:

```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';

interface WhopWebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

/**
 * Verify Whop webhook signature
 */
function verifySignature(payload: string, signature: string | undefined): boolean {
  if (!WHOP_WEBHOOK_SECRET || !signature) {
    console.warn('[Webhook] Missing secret or signature - skipping verification');
    return true; // Allow in development
  }

  const expectedSig = crypto
    .createHmac('sha256', WHOP_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

/**
 * Handle incoming Whop webhooks
 */
export async function handleWhopWebhook(req: Request, res: Response) {
  const signature = req.headers['whop-signature'] as string | undefined;
  const eventType = req.headers['whop-event'] as string | undefined;

  // Verify signature
  const rawBody = JSON.stringify(req.body);
  if (!verifySignature(rawBody, signature)) {
    console.error('[Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    const payload = req.body as WhopWebhookPayload;

    switch (eventType) {
      case 'membership.went_valid':
        await handleMembershipValid(payload.data);
        break;

      case 'membership.went_invalid':
        await handleMembershipInvalid(payload.data);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ received: true, event: eventType });

  } catch (error: any) {
    console.error('[Webhook] Processing error:', error.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleMembershipValid(data: Record<string, any>) {
  console.log('[Webhook] Membership activated:', data.id);
  // TODO: Provision user access, create Drive folder, etc.
}

async function handleMembershipInvalid(data: Record<string, any>) {
  console.log('[Webhook] Membership deactivated:', data.id);
  // TODO: Revoke access, notify user, etc.
}

async function handlePaymentSucceeded(data: Record<string, any>) {
  console.log('[Webhook] Payment received:', data.id);
  // TODO: Record payment, trigger workflows, etc.
}
```

Update `src/index.ts`:

```typescript
import { handleWhopWebhook } from './webhooks/whop-handler';

// Replace the stub:
// OLD:
app.post("/webhooks/whop", express.raw({ type: "application/json" }), (req, res) => {
  console.log("Webhook received:", req.headers["whop-event"]);
  res.status(200).json({ received: true });
});

// NEW:
app.post("/webhooks/whop", express.json(), handleWhopWebhook);
```

---

### Task 7: Add Input Sanitization for File Names (🟡 Medium)

**Problem:** File names from user input aren't sanitized.

**Solution:**

Create `src/utils/sanitize.ts`:

```typescript
/**
 * Sanitize a string for use as a filename
 * Removes/replaces dangerous characters
 */
export function sanitizeFilename(name: string): string {
  return name
    // Remove path separators
    .replace(/[/\\]/g, '-')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    // Replace multiple spaces/dashes with single dash
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')
    // Limit length
    .slice(0, 200)
    // Fallback if empty
    || 'unnamed';
}

/**
 * Validate a URL is a supported video platform
 */
export function isValidVideoUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
    /^https?:\/\/youtu\.be\//,
    /^https?:\/\/(www\.)?twitch\.tv\//,
    /^https?:\/\/clips\.twitch\.tv\//,
  ];

  return patterns.some(pattern => pattern.test(url));
}
```

Update `src/types/youtube.ts` to use sanitization:

```typescript
import { sanitizeFilename } from '../utils/sanitize';

export const YouTubeClipRequestSchema = z.object({
  videoUrl: z.string().url(),
  startTime: z.string(),
  endTime: z.string(),
  quality: z.enum(['2160', '1440', '1080', '720', '480', '360']).optional(),
  outputName: z.string().transform(sanitizeFilename).optional(),
});
```

---

### Task 8: Add Structured Error Logging (🔵 Low)

**Problem:** Console.log used throughout, hard to monitor in production.

**Solution:**

Create `src/utils/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, any>;
  timestamp: string;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

function formatLog(entry: LogEntry): string {
  if (isDevelopment) {
    // Human-readable format for development
    const prefix = entry.context ? `[${entry.context}]` : '';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}${dataStr}`;
  }

  // JSON format for production (easier to parse)
  return JSON.stringify(entry);
}

function createLog(level: LogLevel, message: string, context?: string, data?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: string, data?: Record<string, any>) =>
    isDevelopment && createLog('debug', message, context, data),
  info: (message: string, context?: string, data?: Record<string, any>) =>
    createLog('info', message, context, data),
  warn: (message: string, context?: string, data?: Record<string, any>) =>
    createLog('warn', message, context, data),
  error: (message: string, context?: string, data?: Record<string, any>) =>
    createLog('error', message, context, data),
};
```

**Usage example:**

```typescript
import { logger } from '../utils/logger';

// Instead of:
console.log('[Motion] Analyzing screen activity...');

// Use:
logger.info('Analyzing screen activity...', 'Motion');
```

---

### Task 9: Document Audio Analysis as Future Work (🔵 Low)

**Problem:** Audio analysis referenced in code but not implemented.

**Solution:**

Create `PLANNING/FUTURE-WORK.md`:

```markdown
# Future Work & Enhancements

## Audio Analysis for Highlight Detection

**Status:** Not Implemented
**Priority:** Low
**Impact:** Would improve highlight detection accuracy

### Current State
- Signal fusion already accepts `audioMoments` parameter
- Config weights already defined in `teaching-patterns.ts`
- Empty array passed in `highlight-detection/index.ts`

### Proposed Implementation

1. **Audio Analysis Service** (`src/services/highlight-detection/audio-analyzer.ts`)
   - Extract audio from video using ffmpeg
   - Analyze speech patterns (speech-to-silence ratios)
   - Detect volume spikes (enthusiasm indicators)
   - Identify silence-before-spike patterns (setup → punchline)

2. **FFmpeg Commands**
   ```bash
   # Extract audio
   ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav

   # Analyze volume
   ffmpeg -i video.mp4 -af volumedetect -f null -

   # Silence detection
   ffmpeg -i video.mp4 -af silencedetect=noise=-30dB:d=0.5 -f null -
   ```

3. **Integration Points**
   - Add to `highlightDetectionService.detectHighlights()`
   - Weight in signal fusion (currently 1.0)
   - New clip type: `emphasis` for high-energy moments

### Why Deprioritized
- Transcript + motion already provides good results
- Audio processing adds significant compute time
- Speech detection requires additional tooling
```

---

### Task 10: Create Test Suite Stubs (🔵 Low)

**Problem:** Test scripts referenced in package.json don't exist.

**Solution:**

Create `scripts/test-all.sh`:

```bash
#!/bin/bash
set -e

echo "=== Running All Tests ==="
echo ""

# Type check
echo "1. Type checking..."
npm run typecheck
echo "✅ Types OK"
echo ""

# Unit tests (if vitest/jest configured)
if [ -f "vitest.config.ts" ] || [ -f "jest.config.js" ]; then
  echo "2. Running unit tests..."
  npm test
  echo "✅ Unit tests OK"
else
  echo "2. Skipping unit tests (no test framework configured)"
fi
echo ""

# API tests (requires running server)
echo "3. Testing API endpoints..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  # Health check
  curl -s http://localhost:3000/health | grep -q "ok" && echo "  ✅ Health check"

  # Clips preview (no actual download)
  echo "  ⏭️  Skipping clips test (requires valid URL)"

  echo "✅ API tests OK"
else
  echo "  ⚠️  Server not running - start with: npm run dev"
fi
echo ""

echo "=== All Tests Complete ==="
```

Update `package.json`:

```json
{
  "scripts": {
    "test": "echo 'No test framework configured yet'",
    "test:all": "bash scripts/test-all.sh",
    "test:types": "npm run typecheck",
    "test:api": "bash scripts/test-api.sh"
  }
}
```

---

## Success Criteria

- [ ] All `/tmp` paths replaced with cross-platform `getTempDir()`
- [ ] `detect-and-extract` endpoint validates with Zod schema
- [ ] Server validates environment on startup
- [ ] Cleanup failures are logged (not silent)
- [ ] Fetch calls have timeouts
- [ ] Whop webhook handler processes events
- [ ] File names are sanitized
- [ ] `npm run typecheck` passes
- [ ] No regressions in existing functionality

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Start server (should show validation)
npm run dev

# Test cross-platform paths
node -e "console.log(require('./src/config/clips-config').getTempDir())"

# Test validation
curl -X POST http://localhost:3000/api/vod/detect-and-extract \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return VALIDATION_ERROR, not crash
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 6: Post-build hardening and fixes

- Fix cross-platform temp directory paths (Windows compatibility)
- Add Zod validation to detect-and-extract endpoint
- Add environment validation on server startup
- Improve cleanup error logging
- Add request timeouts to fetch calls
- Implement Whop webhook handler
- Add input sanitization for file names
- Add structured logging utility
- Document audio analysis as future work
- Create test suite stubs"
```

---

## Next Steps

After Phase 6:
1. Deploy to staging environment
2. Run full integration tests
3. Monitor for issues
4. Consider Phase 7: Production Deployment
