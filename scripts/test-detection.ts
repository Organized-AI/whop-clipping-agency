import 'dotenv/config';
import { highlightDetectionService } from '../src/services/highlight-detection';

async function testDetection() {
  // Use a known dev stream VOD for testing
  const testUrl = process.argv[2] || 'YOUR_TEST_VOD_URL';

  if (testUrl === 'YOUR_TEST_VOD_URL') {
    console.log('Usage: npx tsx scripts/test-detection.ts <youtube-url>');
    console.log('Example: npx tsx scripts/test-detection.ts "https://youtube.com/watch?v=dQw4w9WgXcQ"');
    process.exit(1);
  }

  console.log('=== Highlight Detection Test ===\n');

  try {
    // Test quick detection (transcript only)
    console.log('1. Testing quick detection...');
    const quickResults = await highlightDetectionService.quickDetect(testUrl, 5);
    console.log(`   Found ${quickResults.length} highlights:\n`);

    for (const h of quickResults) {
      console.log(`   [${h.clipType}] ${formatTime(h.startTime)} - ${formatTime(h.endTime)}`);
      console.log(`   Score: ${h.totalScore.toFixed(1)}, Confidence: ${(h.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${h.reason.slice(0, 100)}...\n`);
    }

    // Test full detection (with motion)
    console.log('\n2. Testing full detection (with motion analysis)...');
    const fullResults = await highlightDetectionService.detectHighlights({
      vodUrl: testUrl,
      options: {
        maxClips: 5,
        minScore: 3,
        analysisQuality: '480', // Lower quality for faster analysis
      },
    });

    console.log(`\n   Analysis time: ${fullResults.analysisTime.toFixed(1)}s`);
    console.log(`   Highlights found: ${fullResults.highlights.length}\n`);

    for (const h of fullResults.highlights) {
      console.log(`   [${h.clipType}] ${formatTime(h.startTime)} - ${formatTime(h.endTime)}`);
      console.log(`   Signals: T=${h.signals.transcript.toFixed(1)}, M=${h.signals.motion.toFixed(1)}`);
      console.log(`   Score: ${h.totalScore.toFixed(1)}\n`);
    }

    console.log('=== Detection test complete! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

testDetection();
