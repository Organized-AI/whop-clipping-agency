# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Whop Platform                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │Products │  │Members  │  │Payments │  │ Notifications   │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
└───────┼────────────┼────────────┼────────────────┼──────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│              Clipping Agency Backend (Express)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Webhooks   │  │   REST API   │  │    Services      │  │
│  │  /webhooks/  │  │    /api/     │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │            │
│         └─────────────────┴───────────────────┘            │
│                           │                                │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │                   Service Layer                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │  Whop    │ │ Clipper  │ │  Drive   │ │ Notify │  │   │
│  │  │  Setup   │ │  Mgmt    │ │ Service  │ │        │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────┐                   ┌───────────────────┐
│   Supabase    │                   │   Google Drive    │
│  (PostgreSQL) │                   │   (Folders/Files) │
└───────────────┘                   └───────────────────┘
```

## Data Flow

### Client Onboarding
```
1. Client → Whop Checkout → Payment
2. Whop → Webhook → Backend
3. Backend → Create DB record
4. Backend → Create Drive folder
5. Backend → Share folder with client
6. Backend → Send welcome notification
```

### Clipper Assignment
```
1. Admin → Assign clipper to client
2. Backend → Share client folder with clipper
3. Backend → Notify clipper of assignment
4. Backend → Update capacity tracking
```

## Database Schema

### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  whop_membership_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL, -- starter, growth, scale
  drive_folder_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### clippers
```sql
CREATE TABLE clippers (
  id UUID PRIMARY KEY,
  whop_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  capacity_per_week INT,
  current_assignments INT DEFAULT 0,
  rate_per_clip INT, -- cents
  drive_folder_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### assignments
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  clipper_id UUID REFERENCES clippers(id),
  clip_count INT,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Webhooks
- `POST /webhooks/whop` - Whop event receiver

### Clients
- `GET /api/clients` - List clients
- `GET /api/clients/:id` - Get client
- `POST /api/clients/:id/pause` - Pause
- `POST /api/clients/:id/resume` - Resume

### Clippers
- `GET /api/clippers` - List clippers
- `GET /api/clippers/applications` - Applications
- `POST /api/clippers/applications/:id/approve`
- `POST /api/clippers/applications/:id/reject`
- `POST /api/clippers/assign` - Create assignment

### Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue data
