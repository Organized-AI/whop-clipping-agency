import { getDriveService } from '../src/services/drive-service';
import * as fs from 'fs';
import * as path from 'path';

async function testDriveService() {
  console.log('=== Google Drive Service Test ===\n');

  try {
    const driveService = getDriveService();

    // Test 1: Connection
    console.log('1. Testing Drive connection...');
    const connected = await driveService.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Google Drive');
    }
    console.log('   Connected successfully\n');

    // Test 2: Get or create date folder
    console.log('2. Testing date folder creation...');
    const today = new Date();
    const folderId = await driveService.getOrCreateDateFolder(today);
    console.log(`   Folder ready: ${folderId}\n`);

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
    console.log(`   Uploaded: ${uploadResult.fileId}`);
    console.log(`   View: ${uploadResult.webViewLink}\n`);

    // Test 5: Get file metadata
    console.log('5. Getting file metadata...');
    const metadata = await driveService.getFileMetadata(uploadResult.fileId);
    console.log(`   Name: ${metadata.name}`);
    console.log(`   Created: ${metadata.createdTime}\n`);

    // Test 6: Cleanup local test file (skip Drive deletion for Shared Drives)
    console.log('6. Cleaning up local test file...');
    fs.unlinkSync(testFilePath);
    console.log(`   Local file cleaned up`);
    console.log(`   Note: Drive file kept at ${uploadResult.webViewLink}\n`);

    console.log('=== All Drive tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testDriveService();
