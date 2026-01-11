import { clipWorkflowService } from '../src/services/clip-workflow';

// 10 most recent clips from jordaaanhill (sorted by createdAt desc)
const recentClips = [
  { url: 'https://clips.twitch.tv/StormyDeliciousMonkeyNinjaGrumpy-Do1RELp3PPFTXNiP', title: 'Claude Code Mastery Course Promo 1', date: '2026-01-11' },
  { url: 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4', title: 'Creative Suite Hack', date: '2026-01-11' },
  { url: 'https://clips.twitch.tv/DifferentIntelligentPlumageTebowing-qEP_XBsc0o6UH0f3', title: 'Claude + GAds Audit', date: '2025-11-13' },
  { url: 'https://clips.twitch.tv/ElatedAwkwardStinkbugKippa-gz0cF5vdNOXxTPug', title: 'Stape but easier', date: '2025-11-06' },
  { url: 'https://clips.twitch.tv/AgileManlyWrenPJSalt-sAGaqZZ_S3gw6mv-', title: 'Claude Skills', date: '2025-11-06' },
  { url: 'https://clips.twitch.tv/CourageousInexpensivePeachKappa-C1-M3Zoj2YpFeDFu', title: 'Unified after fork', date: '2025-11-06' },
  { url: 'https://clips.twitch.tv/DependableBraveManateeWutFace-pp0h05Z4BvKtJG8C', title: 'CAPI + sGTM', date: '2025-11-04' },
  { url: 'https://clips.twitch.tv/EncouragingTiredDotterelWoofer-8Kg-2bbMlRXwXdJC', title: 'vM Agent Vessel', date: '2025-10-26' },
  { url: 'https://clips.twitch.tv/SmokyPricklyWolfCclamChamp-ceSrAQ09RjX5OiEB', title: 'learning more', date: '2025-10-26' },
  { url: 'https://clips.twitch.tv/CaringDullRadicchioPartyTime-UBfUbInqPMlVv7g-', title: 'wrap up', date: '2025-10-26' },
];

async function batchImport() {
  console.log('=== Batch Import: 10 Most Recent Clips ===\n');

  const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

  for (let i = 0; i < recentClips.length; i++) {
    const clip = recentClips[i];
    console.log(`[${i + 1}/${recentClips.length}] Importing: ${clip.title}`);
    console.log(`   URL: ${clip.url}`);

    try {
      const result = await clipWorkflowService.importClip({
        clipUrl: clip.url,
        quality: '720', // Use 720p to save bandwidth/time
      });

      console.log(`   ✓ Success: ${result.driveUrl}`);
      console.log(`   Folder: ${result.folder}\n`);
      results.success.push(clip.title);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ✗ Failed: ${errorMessage}\n`);
      results.failed.push(`${clip.title}: ${errorMessage}`);
    }

    // Small delay between imports to avoid rate limiting
    if (i < recentClips.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed clips:');
    results.failed.forEach(f => console.log(`  - ${f}`));
  }

  console.log('\n=== Batch import complete! ===');
}

batchImport().catch(console.error);
