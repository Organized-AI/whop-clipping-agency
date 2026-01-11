import { scrapCreatorsService } from '../src/services/scrapcreators-service';

async function testScrapCreators() {
  const testUrl = 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4';

  console.log('=== ScrapCreators Service Test ===\n');

  try {
    // Test 1: Extract slug
    console.log('1. Testing slug extraction...');
    const slug = scrapCreatorsService.extractSlug(testUrl);
    console.log(`   Extracted slug: ${slug}\n`);

    // Test 2: Fetch clip data
    console.log('2. Fetching clip data from API...');
    const response = await scrapCreatorsService.fetchClipData(testUrl);
    console.log(`   Success: ${response.success}`);
    console.log(`   Credits remaining: ${response.credits_remaining}\n`);

    // Test 3: Process clip data
    console.log('3. Processing clip data...');
    const processedClip = scrapCreatorsService.processClipData(response, '1080');
    console.log(`   Title: ${processedClip.title}`);
    console.log(`   Broadcaster: ${processedClip.broadcaster}`);
    console.log(`   Duration: ${processedClip.duration}s`);
    console.log(`   Video URL: ${processedClip.videoUrl.slice(0, 80)}...\n`);

    // Test 4: Download video (optional - comment out to save credits)
    console.log('4. Downloading video...');
    const localPath = await scrapCreatorsService.downloadVideo(processedClip);
    console.log(`   Downloaded to: ${localPath}\n`);

    // Cleanup
    console.log('5. Cleaning up...');
    scrapCreatorsService.cleanupTempFile(localPath);
    console.log('   Done!\n');

    console.log('=== All tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testScrapCreators();
