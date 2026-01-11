---
name: test
description: Run project test suites
arguments:
  - name: suite
    description: Test suite to run (scrapcreators, drive, workflow, api, all)
    required: false
---

# Test Command

Run project test suites for the clip import system.

## Usage
```
/test [suite]
```

## Available Suites

| Suite | Command | Description |
|-------|---------|-------------|
| scrapcreators | `npm run test:scrapcreators` | ScrapCreators API service |
| drive | `npm run test:drive` | Google Drive service |
| workflow | `npm run test:workflow` | Full import workflow |
| api | `npm run test:api` | API endpoints (server must be running) |
| all | `npm run test:all` | All suites except API |

## Examples
```
/test                    # Run all tests
/test scrapcreators      # Test ScrapCreators only
/test drive              # Test Google Drive only
/test workflow           # Test full workflow
/test api                # Test API (start server first)
```

## Execution

### Single Suite
```bash
npm run test:$suite
```

### All Tests
```bash
npm run test:all
```

### API Tests (requires server)
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:api
```

## Expected Output

### ScrapCreators Test
```
=== ScrapCreators Service Test ===
1. Testing slug extraction... ✅
2. Fetching clip data from API... ✅
3. Processing clip data... ✅
4. Downloading video... ✅
5. Cleaning up... ✅
=== All tests passed! ===
```

### Drive Test
```
=== Google Drive Service Test ===
1. Testing Drive connection... ✅
2. Testing date folder creation... ✅
3. Listing files... ✅
4. Testing file upload... ✅
5. Cleaning up... ✅
=== All Drive tests passed! ===
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| API 401 | Check SCRAPCREATORS_API_KEY in .env |
| Drive 403 | Share folder with service account email |
| Module not found | Run `npm install` |
| TypeScript error | Run `npm run typecheck` |
