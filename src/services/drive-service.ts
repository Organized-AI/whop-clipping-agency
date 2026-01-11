import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
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
      scopes: ['https://www.googleapis.com/auth/drive'],
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
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
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
      supportsAllDrives: true,
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
      supportsAllDrives: true,
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
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
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
    await this.drive.files.delete({ fileId, supportsAllDrives: true });
    console.log(`Deleted file: ${fileId}`);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, size, createdTime, webViewLink, parents',
      supportsAllDrives: true,
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
        supportsAllDrives: true,
      });
      console.log(`Connected to folder: ${response.data.name} (${response.data.id})`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Drive connection failed:', errorMessage);
      return false;
    }
  }
}

// Lazy singleton - only initialize when actually used
let driveServiceInstance: DriveService | null = null;

export function getDriveService(): DriveService {
  if (!driveServiceInstance) {
    driveServiceInstance = new DriveService();
  }
  return driveServiceInstance;
}

// For backward compatibility, but throws if service account is missing
export const driveService = new Proxy({} as DriveService, {
  get(_, prop) {
    const instance = getDriveService();
    const value = instance[prop as keyof DriveService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
