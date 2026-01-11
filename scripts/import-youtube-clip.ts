#!/usr/bin/env npx tsx
/**
 * YouTube Clip Import CLI
 * 
 * Usage:
 *   npx tsx scripts/import-youtube-clip.ts <youtube-url> <start-time> <end-time> [quality]
 * 
 * Examples:
 *   npx tsx scripts/import-youtube-clip.ts "https://youtube.com/watch?v=VIDEO_ID" "1:30" "2:45"
 *   npx tsx scripts/import-youtube-clip.ts "https://youtu.be/VIDEO_ID" "0:00" "0:30" 720
 */

import { youtubeWorkflowService } from '../src/services/youtube-workflow';
import { YouTubeQuality } from '../src/types/youtube';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
📹 YouTube Clip Import CLI

Usage:
  npx tsx scripts/import-youtube-clip.ts <youtube-url> <start-time> <end-time> [quality]

Arguments:
  youtube-url   Full YouTube URL (youtube.com/watch?v=... or youtu.be/...)
  start-time    Start timestamp (HH:MM:SS, MM:SS, or seconds)
  end-time      End timestamp (HH:MM:SS, MM:SS, or seconds)
  quality       Optional: 2160, 1440, 1080 (default), 720, 480, 360

Examples:
  npx tsx scripts/import-youtube-clip.ts "https://youtube.com/watch?v=dQw4w9WgXcQ" "0:43" "1:30"
  npx tsx scripts/import-youtube-clip.ts "https://youtu.be/jNQXAC9IVRw" "0:00" "0:10" 720
`);
    process.exit(1);
  }

  const [videoUrl, startTime, endTime, qualityArg] = args;
  const quality = (qualityArg || '1080') as YouTubeQuality;

  console.log('\n🎬 YouTube Clip Import\n');
  console.log(`URL: ${videoUrl}`);
  console.log(`Range: ${startTime} → ${endTime}`);
  console.log(`Quality: ${quality}p\n`);

  try {
    const result = await youtubeWorkflowService.importClip({
      videoUrl,
      startTime,
      endTime,
      quality,
    });

    console.log('\n✅ Import Successful!\n');
    console.log(`Video: ${result.title}`);
    console.log(`Channel: ${result.channel}`);
    console.log(`Duration: ${result.duration}s`);
    console.log(`Drive Folder: ${result.folder}`);
    console.log(`\n🔗 Drive URL: ${result.driveUrl}`);
  } catch (error: any) {
    console.error('\n❌ Import Failed:', error.message);
    process.exit(1);
  }
}

main();
