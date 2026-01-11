# Phase 2: Google Drive Service

## Objective
Build the Google Drive service using Service Account authentication for uploading clips and managing date-based folder structure.

---

## Context Files to Read First
1. `src/config/clips-config.ts` - Configuration loader
2. `config/service-account.json` - Service account credentials (must exist)
3. `PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md` - Folder structure

---

## Dependencies
- Phase 0 must be complete
- Phase 1 must be complete
- Service account JSON file must exist at `config/service-account.json`
- Target Drive folder must be shared with service account email

---

## Pre-Phase Checklist

Before starting, verify:
- [ ] `config/service-account.json` exists with valid credentials
- [ ] Target folder (`1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb`) is shared with service account email

---

## Tasks

### Task 1: Create Drive service

Create `src/services/drive-service.ts`:

```typescript
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { clipsConfig } from '../config/clips-config';

export class DriveService {
  private drive: drive_v3.Drive;
  private parentFolderId: string;
  private folderCache: Map<string, string> = new Map();

  constructor() {
    this.parentFolderId = clipsConfig.googleDrive.parentFolderId;
    this.drive = this.initializeDrive();
  }

  /**
   * Initialize Google Drive API with Service Account
   */
  private initializeDrive(): drive_v3.Drive {
    const serviceAccountPath = clipsConfig.googleDrive.serviceAccountPath;
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account file not found at: ${serviceAccountPath}\n` +
        'Please create a service account and download the JSON key file.\n' +
        'See: PLANNING/SCRAPCREATORS-DRIVE-MASTER-PLAN.md for instructions.'
      );
    }

    const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  }

  /**
   * Format date as folder name (YYYY-MM-DD)
   */
  private formatDateFolder(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Find or create a date-based subfolder
   */
  async getOrCreateDateFolder(date: Date = new Date()): Promise<string> {
    const folderName = this.formatDateFolder(date);

    // Check cache first
    if (this.folderCache.has(folderName)) {
      return this.folderCache.get(folderName)!;
    }

    // Search for existing folder
    const searchResponse = await this.drive.files.list({
      q: `name='${folderName}' and '${this.parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const folderId = searchResponse.data.files[0].id!;
      this.folderCache.set(folderName, folderId);
      console.log(`Found existing folder: ${folderName} (${folderId})`);
      return folderId;
    }

    // Create new folder
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.parentFolderId],
      },
      fields: 'id, name',
    });

    const newFolderId = createResponse.data.id!;
    this.folderCache.set(folderName, newFolderId);
    console.log(`Created new folder: ${folderName} (${newFolderId})`);
    return newFolderId;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    localPath: string,
    fileName: string,
    folderId: string,
    mimeType: string = 'video/mp4'
  ): Promise<{ fileId: string; webViewLink: string }> {
    console.log(`Uploading: ${fileName} to folder ${folderId}`);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: fs.createReadStream(localPath),
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = response.data.id!;
    const webViewLink = response.data.webViewLink || 
      `https://drive.google.com/file/d/${fileId}/view`;

    console.log(`Uploaded successfully: ${fileId}`);
    console.log(`View link: ${webViewLink}`);

    return { fileId, webViewLink };
  }

  /**
   * Upload a clip to the appropriate date folder
   */
  async uploadClip(
    localPath: string,
    clipTitle: string,
    broadcaster: string,
    clipDate: Date = new Date()
  ): Promise<{ fileId: string; webViewLink: string; folder: string }> {
    // Get or create date folder
    const folderId = await this.getOrCreateDateFolder(clipDate);
    const folderName = this.formatDateFolder(clipDate);

    // Create clean filename
    const cleanTitle = clipTitle
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    const fileName = `${broadcaster}-${cleanTitle}.mp4`;

    // Upload file
    const result = await this.uploadFile(localPath, fileName, folderId);

    return {
      ...result,
      folder: folderName,
    };
  }

  /**
   * List files in a folder
   */
  async listFiles(
    folderId: string = this.parentFolderId,
    limit: number = 100
  ): Promise<Array<{ id: string; name: string; createdTime: string }>> {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, mimeType)',
      orderBy: 'createdTime desc',
      pageSize: limit,
    });

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      createdTime: file.createdTime!,
    }));
  }

  /**
   * Delete a file by ID
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
    console.log(`Deleted file: ${fileId}`);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, size, createdTime, webViewLink, parents',
    });
    return response.data;
  }

  /**
   * Test connection to Google Drive
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.drive.files.get({
        fileId: this.parentFolderId,
        fields: 'id, name',
      });
      console.log(`Connected to folder: ${response.data.name} (${response.data.id})`);
      return true;
    } catch (error: any) {
      console.error('Drive connection failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const driveService = new DriveService();
```

### Task 2: Create test script

Create `scripts/test-drive.ts`:

```typescript
import { driveService } from '../src/services/drive-service';
import * as fs from 'fs';
import * as path from 'path';

async function testDriveService() {
  console.log('=== Google Drive Service Test ===\n');

  try {
    // Test 1: Connection
    console.log('1. Testing Drive connection...');
    const connected = await driveService.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Google Drive');
    }
    console.log('   ✅ Connected successfully\n');

    // Test 2: Get or create date folder
    console.log('2. Testing date folder creation...');
    const today = new Date();
    const folderId = await driveService.getOrCreateDateFolder(today);
    console.log(`   ✅ Folder ready: ${folderId}\n`);

    // Test 3: List files in parent folder
    console.log('3. Listing files in parent folder...');
    const files = await driveService.listFiles();
    console.log(`   Found ${files.length} files/folders:`);
    files.slice(0, 5).forEach((f) => {
      console.log(`   - ${f.name}`);
    });
    console.log('');

    // Test 4: Create and upload test file
    console.log('4. Testing file upload...');
    const testFilePath = path.join('temp', 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'Test file from DriveService ' + new Date().toISOString());
    
    const uploadResult = await driveService.uploadFile(
      testFilePath,
      'test-file-' + Date.now() + '.txt',
      folderId,
      'text/plain'
    );
    console.log(`   ✅ Uploaded: ${uploadResult.fileId}`);
    console.log(`   View: ${uploadResult.webViewLink}\n`);

    // Test 5: Get file metadata
    console.log('5. Getting file metadata...');
    const metadata = await driveService.getFileMetadata(uploadResult.fileId);
    console.log(`   Name: ${metadata.name}`);
    console.log(`   Created: ${metadata.createdTime}\n`);

    // Test 6: Cleanup test file
    console.log('6. Cleaning up test file...');
    await driveService.deleteFile(uploadResult.fileId);
    fs.unlinkSync(testFilePath);
    console.log('   ✅ Cleaned up\n');

    console.log('=== All Drive tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testDriveService();
```

### Task 3: Add test script to package.json

Add to `scripts` in `package.json`:

```json
{
  "scripts": {
    "test:drive": "npx tsx scripts/test-drive.ts"
  }
}
```

---

## Success Criteria

- [ ] `src/services/drive-service.ts` created and exports singleton
- [ ] `npm run typecheck` passes
- [ ] `npm run test:drive` successfully:
  - Connects to Google Drive
  - Gets/creates date folder
  - Lists files
  - Uploads test file
  - Gets metadata
  - Deletes test file

---

## Verification Commands

```bash
npm run typecheck
npm run test:drive
```

Expected output:
```
=== Google Drive Service Test ===

1. Testing Drive connection...
   Connected to folder: Twitch Clips (1SJ71RXmGln7sDI8Vs1aX-SeiDpSO09Eb)
   ✅ Connected successfully

2. Testing date folder creation...
   Created new folder: 2026-01-11 (1abc123xyz)
   ✅ Folder ready: 1abc123xyz

3. Listing files in parent folder...
   Found 2 files/folders:
   - 2026-01-11

4. Testing file upload...
   ✅ Uploaded: 1def456uvw

5. Getting file metadata...
   Name: test-file-1736560000000.txt

6. Cleaning up test file...
   ✅ Cleaned up

=== All Drive tests passed! ===
```

---

## Troubleshooting

### "Service account file not found"
- Ensure `config/service-account.json` exists
- Download from Google Cloud Console → IAM → Service Accounts → Keys

### "The caller does not have permission"
- Share the target folder with the service account email
- Service account email is in the JSON file under `client_email`

### "File not found" when testing connection
- Verify `GOOGLE_DRIVE_PARENT_FOLDER` is correct folder ID
- Folder ID is the last part of the Google Drive folder URL

---

## Git Commit

```bash
git add -A
git commit -m "Phase 2: Google Drive service with service account auth"
```

---

## Next Phase

After completing all tasks and verification, proceed to:
`PLANNING/implementation-phases/PHASE-3-WORKFLOW.md`
