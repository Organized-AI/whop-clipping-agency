# Test Suite

This directory contains test stubs for the whop-clipping-agency project.

## Test Categories

### Unit Tests
- `utils/sanitize.test.ts` - Filename and input sanitization
- `utils/logger.test.ts` - Structured logging
- `services/transcript-analyzer.test.ts` - Transcript pattern matching
- `services/signal-fusion.test.ts` - Signal combination logic

### Integration Tests
- `services/scrapcreators-service.test.ts` - ScrapCreators API (mocked)
- `services/youtube-service.test.ts` - YouTube service (mocked)
- `services/drive-service.test.ts` - Google Drive service (mocked)
- `webhooks/whop-handler.test.ts` - Webhook signature verification

### E2E Tests (require running server)
- `api/clips.test.ts` - Clip import endpoints
- `api/youtube.test.ts` - YouTube import endpoints
- `api/vod.test.ts` - VOD detection and extraction

## Running Tests

```bash
# Install test dependencies (when added)
npm install --save-dev jest @types/jest ts-jest

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests (server must be running)
npm run test:e2e
```

## Test Configuration

When test framework is added, create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
```

## Mocking Guidelines

- Use `jest.mock()` for external services (ScrapCreators, Google Drive)
- Mock filesystem operations for unit tests
- Use `nock` or similar for HTTP mocking
- Keep test data in `__fixtures__/` directory
