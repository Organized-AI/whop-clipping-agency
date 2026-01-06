# Phase 0: Project Setup

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Initialize a TypeScript Node.js project for the Whop Clipping Agency backend.

### 1. Initialize Project
```bash
npm init -y
npm install typescript @types/node ts-node tsx -D
npm install express @types/express zod dotenv
npm install @whop/sdk googleapis
```

### 2. Create tsconfig.json
- Strict mode enabled
- ES2022 target
- Path aliases: `@/*` → `src/*`
- OutDir: `dist/`

### 3. Create .env.example
```env
# Whop Configuration
WHOP_API_KEY=
WHOP_APP_ID=
WHOP_WEBHOOK_SECRET=

# Google Drive
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_DRIVE_PARENT_FOLDER=

# Database
DATABASE_URL=

# Server
PORT=3000
NODE_ENV=development
```

### 4. Create Project Structure
```
src/
├── index.ts          # Entry point
├── api/              # REST endpoints
├── webhooks/         # Webhook handlers
├── services/         # Business logic
├── types/            # TypeScript types
├── utils/            # Helper functions
└── config/           # Configuration
```

### 5. Package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

### 6. Create src/index.ts
Basic Express server with:
- Health check endpoint at `/`
- Webhook endpoint placeholder at `/webhooks/whop`
- Error handling middleware
- CORS configuration

## Expected Output
- Working TypeScript project
- All dependencies installed
- Server running on port 3000
- Ready for Phase 1 implementation
