# Whop Clipping Agency

Automated clipping agency management system built on the Whop platform.

## Business Model

| Tier | Price | Clips/Month | Ad Budget |
|------|-------|-------------|-----------|
| Starter | $5,000 | 30 | $2k-$5k |
| Growth | $8,000 | 60 | $5k-$15k |
| Scale | $15,000 | 120 | $15k+ |

Base: $3,000/month management + 10% ad spend

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Platform**: Whop (memberships, notifications, experiences)
- **Storage**: Google Drive API
- **Database**: Supabase/PostgreSQL
- **Validation**: Zod

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your credentials

# Run development server
npm run dev
```

## Project Structure

```
src/
├── index.ts              # Express server entry
├── api/                  # REST API endpoints
│   ├── routes.ts
│   └── controllers/
├── webhooks/             # Whop webhook handlers
│   ├── whop-handler.ts
│   └── events/
├── services/             # Business logic
│   ├── whop-setup.ts
│   ├── clipper-management.ts
│   ├── drive-service.ts
│   └── notifications.ts
├── types/                # TypeScript definitions
├── config/               # Configuration
└── utils/                # Helpers
```

## Implementation Phases

See [PHASED_PLAN.md](./PHASED_PLAN.md) for full implementation guide.

| Phase | Focus | MVP? |
|-------|-------|------|
| 0 | Project Setup | ✅ |
| 1 | Whop Products | ✅ |
| 2 | Webhooks | ✅ |
| 3 | Clipper System | |
| 4 | Drive Integration | |
| 5 | Admin API | |
| 6 | Notifications | |

## Claude Code Commands

Each phase has a dedicated prompt file in `docs/phases/`:

```bash
# Start with Phase 0
claude --dangerously-skip-permissions
# Then follow PHASE_0_SETUP.md instructions
```

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients/:id/pause` - Pause membership
- `POST /api/clients/:id/resume` - Resume membership

### Clippers
- `GET /api/clippers` - List clippers
- `GET /api/clippers/applications` - Get applications
- `POST /api/clippers/applications/:id/approve` - Approve
- `POST /api/clippers/applications/:id/reject` - Reject
- `POST /api/clippers/assign` - Assign to client

### Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue breakdown

### Webhooks
- `POST /webhooks/whop` - Whop event receiver

## Environment Variables

```env
# Whop
WHOP_API_KEY=
WHOP_APP_ID=
WHOP_WEBHOOK_SECRET=

# Google Drive
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_DRIVE_PARENT_FOLDER=

# Database
DATABASE_URL=

# Server
PORT=3000
NODE_ENV=development
ADMIN_API_KEY=
```

## License

Private - BHT Labs
