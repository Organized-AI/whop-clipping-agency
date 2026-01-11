import { youtubeService } from '../src/services/youtube-service';
import { youtubeWorkflowService } from '../src/services/youtube-workflow';

// Test video - a short public domain video
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video

async function testYouTubeService() {
  console.log('=== YouTube Service Test ===\n');

  try {
    // Test 1: Extract video ID
    console.log('1. Testing video ID extraction...');
    const testUrls = [
      'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      'https://youtu.be/jNQXAC9IVRw',
      'https://www.youtube.com/embed/jNQXAC9IVRw',
      'https://www.youtube.com/shorts/abc123defgh',
    ];
    
    for (const url of testUrls) {
      try {
        const id = youtubeService.extractVideoId(url);
        console.log(`   ✅ ${url} → ${id}`);
      } catch (e: any) {
        console.log(`   ⚠️ ${url} → ${e.message}`);
      }
    }
    console.log('');

    // Test 2: Timestamp parsing
    console.log('2. Testing timestamp parsing...');
    const timestamps = ['1:23:45', '23:45', '45', '1:23'];
    for (const ts of timestamps) {
      const seconds = youtubeService.parseTimestamp(ts);
      const formatted = youtubeService.formatTimestamp(seconds);
      console.log(`   ${ts} → ${seconds}s → ${formatted}`);
    }
    console.log('');

    // Test 3: Get video info
    console.log('3. Testing video info fetch...');
    const videoInfo = await youtubeService.getVideoInfo(TEST_VIDEO_URL);
    console.log(`   Title: ${videoInfo.title}`);
    console.log(`   Channel: ${videoInfo.channel}`);
    console.log(`   Duration: ${videoInfo.durationString} (${videoInfo.duration}s)`);
    console.log(`   Views: ${videoInfo.viewCount.toLocaleString()}`);
    console.log(`   Chapters: ${videoInfo.chapters?.length || 0}`);
    console.log('');

    // Test 4: Get available qualities
    console.log('4. Testing quality detection...');
    const qualities = await youtubeService.getAvailableQualities(TEST_VIDEO_URL);
    console.log(`   Available: ${qualities.join('p, ')}p`);
    console.log('');

    // Test 5: Download a short clip (only if video is > 10 seconds)
    if (videoInfo.duration >= 10) {
      console.log('5. Testing clip download (0:00 - 0:05)...');
      const clipPath = await youtubeService.downloadClip({
        videoUrl: TEST_VIDEO_URL,
        startTime: '0:00',
        endTime: '0:05',
        quality: '720',
      });
      console.log(`   ✅ Downloaded to: ${clipPath}`);
      
      // Cleanup
      console.log('   Cleaning up...');
      youtubeService.cleanupTempFile(clipPath);
      console.log('   ✅ Cleaned up');
    } else {
      console.log('5. Skipping clip download (video too short)');
    }
    console.log('');

    console.log('=== All YouTube tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
testYouTubeService();
