const BASE_URL = 'http://localhost:3000';

async function testApi() {
  console.log('=== API Endpoint Tests ===\n');
  console.log('Make sure the server is running: npm run dev\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log(`   Status: ${health.status}\n`);

    // Test 2: Preview endpoint
    console.log('2. Testing preview endpoint...');
    const previewRes = await fetch(`${BASE_URL}/api/clips/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipUrl: 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4',
      }),
    });
    const preview = await previewRes.json();
    console.log(`   Success: ${preview.success}`);
    console.log(`   Title: ${preview.data?.title}\n`);

    // Test 3: Import endpoint
    console.log('3. Testing import endpoint...');
    const importRes = await fetch(`${BASE_URL}/api/clips/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clipUrl: 'https://clips.twitch.tv/SmokySleepySkunkCorgiDerp-A-5bPfXQK4KfzTt4',
        quality: '720', // Use 720p to save bandwidth
      }),
    });
    const importResult = await importRes.json();
    console.log(`   Success: ${importResult.success}`);
    if (importResult.success) {
      console.log(`   Drive URL: ${importResult.data.driveUrl}`);
      console.log(`   Folder: ${importResult.data.folder}`);
    } else {
      console.log(`   Error: ${importResult.error?.message}`);
    }

    console.log('\n=== API tests complete! ===');
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ECONNREFUSED') {
      console.error('Error: Server not running. Start it with: npm run dev');
    } else {
      console.error('Test failed:', error);
    }
    process.exit(1);
  }
}

testApi();
