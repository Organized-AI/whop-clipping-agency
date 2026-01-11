import { clipWorkflowService } from '../src/services/clip-workflow';

async function testWorkflow() {
  const testUrl = 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4';

  console.log('=== End-to-End Workflow Test ===\n');

  try {
    // Test 1: Preview (no download/upload)
    console.log('1. Testing preview (no credits used for download)...');
    const preview = await clipWorkflowService.previewClip(testUrl);
    console.log(`   Title: ${preview.title}`);
    console.log(`   Broadcaster: ${preview.broadcaster}`);
    console.log(`   Duration: ${preview.duration}s\n`);

    // Test 2: Full import
    console.log('2. Testing full import workflow...');
    const result = await clipWorkflowService.importClip({
      clipUrl: testUrl,
      quality: '1080',
    });

    console.log('\n=== Import Result ===');
    console.log(`Clip ID: ${result.clipId}`);
    console.log(`Title: ${result.title}`);
    console.log(`Broadcaster: ${result.broadcaster}`);
    console.log(`Duration: ${result.duration}s`);
    console.log(`Drive File ID: ${result.driveFileId}`);
    console.log(`Drive URL: ${result.driveUrl}`);
    console.log(`Folder: ${result.folder}`);

    console.log('\n=== Workflow test passed! ===');
  } catch (error) {
    console.error('Workflow test failed:', error);
    process.exit(1);
  }
}

testWorkflow();
