import 'dotenv/config';
import { vodService } from '../src/services/vod-service';

async function testVodExtract() {
  const testUrl = process.argv[2] || 'YOUR_TEST_VOD_URL';

  if (testUrl === 'YOUR_TEST_VOD_URL') {
    console.log('Usage: npx tsx scripts/test-vod-extract.ts <youtube-url>');
    console.log('Example: npx tsx scripts/test-vod-extract.ts "https://youtube.com/watch?v=dQw4w9WgXcQ"');
    process.exit(1);
  }

  console.log('=== VOD Multi-Clip Extraction Test ===\n');

  try {
    const result = await vodService.extractClips({
      vodUrl: testUrl,
      clips: [
        { startTime: '0:00', endTime: '0:15', name: 'intro' },
        { startTime: '1:00', endTime: '1:30', name: 'segment-1' },
        { startTime: '2:00', endTime: '2:20', name: 'segment-2' },
      ],
      quality: '720',
    });

    console.log('\n=== Results ===');
    console.log(`Successful: ${result.successful}/${result.totalClips}`);
    console.log(`Processing time: ${result.processingTime.toFixed(1)}s`);

    for (const clip of result.clips) {
      console.log(`\n${clip.name}:`);
      console.log(`  ${clip.driveUrl}`);
    }

    if (result.errors) {
      console.log('\nErrors:');
      for (const e of result.errors) {
        console.log(`  ${e.clip}: ${e.error}`);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testVodExtract();
