# Phase 0: Project Setup

## Objective
Initialize the Whop Clipping Agency project with TypeScript, Express, and all required dependencies.

---

## Prerequisites
- Node.js 18+ installed
- npm or yarn available
- Git initialized

---

## Agent Usage
Claude Code will automatically invoke:
- **backend-dev**: Project structure, TypeScript config, Express setup

---

## Tasks

### 1. Initialize package.json

Create `package.json` with dependencies:

```json
{
  "name": "whop-clipping-agency",
  "version": "1.0.0",
  "description": "Automated clipping agency management on Whop platform",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "setup": "tsx src/scripts/setup-products.ts"
  },
  "dependencies": {
    "@whop/sdk": "^1.0.0",
    "express": "^4.18.2",
    "googleapis": "^130.0.0",
    "zod": "^3.22.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.2"
  }
}
```

### 2. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Create Environment Template

Create `.env.example`:

```env
# Whop API
WHOP_API_KEY=apik_xxx
WHOP_APP_ID=app_xxx
WHOP_WEBHOOK_SECRET=whsec_xxx

# Google Drive
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_PARENT_FOLDER=xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/clipping_agency

# Server
PORT=3000
NODE_ENV=development
```

### 4. Create .gitignore

```
# Dependencies
node_modules/

# Build output
dist/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/
```

### 5. Create Express Entry Point

Create `src/index.ts`:

```typescript
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Webhook placeholder
app.post("/webhooks/whop", (req, res) => {
  console.log("Webhook received:", req.body);
  res.json({ received: true });
});

// API placeholder
app.get("/api", (_req, res) => {
  res.json({
    name: "Whop Clipping Agency API",
    version: "1.0.0",
    endpoints: ["/health", "/webhooks/whop", "/api"]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
```

### 6. Create Project Structure

Create empty directories:

```
src/
├── api/
│   └── controllers/
├── config/
├── lib/
├── scripts/
├── services/
├── templates/
├── types/
├── utils/
└── webhooks/
    ├── events/
    └── middleware/
```

---

## Success Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server on port 3000
- [ ] `npm run typecheck` passes with no errors
- [ ] GET `/health` returns `{ status: "ok" }`
- [ ] POST `/webhooks/whop` logs payload and returns `{ received: true }`
- [ ] All environment variables documented in `.env.example`

---

## Verification Commands

```bash
# Install dependencies
npm install

# Check TypeScript compilation
npm run typecheck

# Start development server
npm run dev

# Test endpoints (in another terminal)
curl http://localhost:3000/health
curl -X POST http://localhost:3000/webhooks/whop -H "Content-Type: application/json" -d '{"test": true}'
```

---

## Completion

Create `docs/phases/PHASE_0_COMPLETE.md`:

```markdown
# Phase 0: Project Setup - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] package.json with all dependencies
- [x] tsconfig.json with strict mode
- [x] .env.example with all variables
- [x] .gitignore
- [x] src/index.ts Express entry point
- [x] Project directory structure

## Verification
- `npm install`: ✅
- `npm run typecheck`: ✅
- `npm run dev`: ✅
- GET /health: ✅

## Next Phase
Proceed to Phase 1: Whop Product Setup
```

Then commit:
```bash
git add -A && git commit -m "Phase 0: Project setup complete"
```

Or use: `/commit feat Phase 0 project setup complete`
