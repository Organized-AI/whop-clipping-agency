# Phase 0: Environment Setup

## Objective
Configure environment variables, install dependencies, and prepare service account for ScrapCreators → Google Drive integration.

---

## Context Files to Read First
1. `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - Architecture overview
2. `.env.example` - Current environment template
3. `package.json` - Current dependencies

---

## Tasks

### Task 1: Update package.json with new dependencies

Add these dependencies to the existing `package.json`:

```json
{
  "dependencies": {
    "googleapis": "^144.0.0",
    "node-fetch": "^3.3.2",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0"
  }
}
```

Run: `npm install googleapis node-fetch uuid && npm install -D @types/uuid`

### Task 2: Create config directory

```bash
mkdir -p config
```

### Task 3: Create service account placeholder

Create `config/service-account.example.json`:

```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "SERVICE_ACCOUNT_EMAIL@PROJECT.iam.gserviceaccount.com",
  "client_id": "CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Task 4: Update .env.example

Add these new variables to `.env.example`:

```env
# ScrapCreators API
SCRAPCREATORS_API_KEY=
SCRAPCREATORS_API_URL=https://api.scrapecreators.com/v1

# Google Drive (Service Account)
GOOGLE_DRIVE_PARENT_FOLDER=1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json

# Clip Settings
DEFAULT_CLIP_QUALITY=1080
TEMP_DOWNLOAD_PATH=./temp
```

### Task 5: Create .env file (if not exists)

Copy from `.env.example` and fill in:

```env
# ScrapCreators API
SCRAPCREATORS_API_KEY=EsEkylUc02fol6qfBHP3V6uIlC73
SCRAPCREATORS_API_URL=https://api.scrapecreators.com/v1

# Google Drive (Service Account)
GOOGLE_DRIVE_PARENT_FOLDER=1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json

# Clip Settings
DEFAULT_CLIP_QUALITY=1080
TEMP_DOWNLOAD_PATH=./temp
```

### Task 6: Update .gitignore

Add these entries to `.gitignore`:

```
# Service Account (sensitive)
config/service-account.json

# Temp downloads
temp/
*.mp4

# Keep example
!config/service-account.example.json
```

### Task 7: Create temp directory

```bash
mkdir -p temp
touch temp/.gitkeep
```

### Task 8: Create config loader

Create `src/config/clips-config.ts`:

```typescript
import { config } from 'dotenv';
import { z } from 'zod';

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
```

---

## Success Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run typecheck` passes (no config errors)
- [ ] `config/service-account.example.json` exists
- [ ] `.env` file has all ScrapCreators and Drive variables
- [ ] `.gitignore` excludes service account and temp files
- [ ] `src/config/clips-config.ts` loads without errors

---

## Verification Commands

```bash
npm install
npm run typecheck
ls -la config/
cat .env | grep SCRAPCREATORS
cat .env | grep GOOGLE_DRIVE
```

---

## Git Commit

```bash
git add -A
git commit -m "Phase 0: Environment setup for ScrapCreators-Drive integration"
```

---

## Next Phase

After completing all tasks and verification, proceed to:
`PLANNING/implementation-phases/PHASE-1-SCRAPCREATORS.md`
