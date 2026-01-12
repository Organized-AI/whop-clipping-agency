# V2 Roadmap: Agency Management System

**Status:** Staged for Future Implementation  
**Created:** January 2026  
**Priority:** After V1 clip import pipeline is complete

---

## V1 vs V2 Strategy

### V1: Clip Import Pipeline (Current Focus)
Get clips into Google Drive efficiently:
- Twitch clips via ScrapCreators API ✅
- YouTube clips via yt-dlp ✅
- VOD highlight detection (Phase 5) 📋
- Organized Drive folder structure ✅

### V2: Agency Management + Distribution (These Phases)
Run the clipping agency business AND distribute content:
- Whop product tiers & memberships
- Clipper applications & assignments
- Client notifications & alerts
- Admin dashboard & analytics
- **Instagram auto-posting** ← NEW

---

## V2 Phase Overview

| Phase | Name | Purpose |
|-------|------|---------|
| **V2-0** | Project Setup | TypeScript/Express scaffolding |
| **V2-1** | Whop Products | Starter/Growth/Scale tiers ($5k-$15k/mo) |
| **V2-2** | Webhooks | Membership events, async queue |
| **V2-3** | Clipper System | Applications, approvals, assignments |
| **V2-4** | Drive Integration | OAuth flow, folder provisioning per client |
| **V2-5** | Admin API | Client/clipper management endpoints |
| **V2-6** | Notifications | Alerts, overdue monitoring |
| **V2-7** | **Instagram Auto-Post** | Programmatic posting to Reels via Graph API |

---

## Business Model (From Original Plan)

```
Base: $3,000/month management fee + 10% ad spend
Minimum ad budget: $2,000/month

| Tier    | Monthly | Clips/Month | Ad Budget Range |
|---------|---------|-------------|-----------------|
| Starter | $5,000  | 30 clips    | $2k-$5k         |
| Growth  | $8,000  | 60 clips    | $5k-$15k        |
| Scale   | $15,000 | 120 clips   | $15k+           |
```

---

## Files in This Directory

| File | Content |
|------|---------|
| `PHASED_PLAN.md` | Combined overview with Claude Code integration |
| `PHASE_0_SETUP.md` | Environment & dependency setup |
| `PHASE_1_WHOP_PRODUCTS.md` | Product tier configuration |
| `PHASE_2_WEBHOOKS.md` | Webhook signature verification & handlers |
| `PHASE_3_CLIPPERS.md` | Clipper application & assignment system |
| `PHASE_4_DRIVE.md` | Google Drive OAuth & folder management |
| `PHASE_5_ADMIN_API.md` | Admin endpoints for management |
| `PHASE_6_NOTIFICATIONS.md` | Alert & notification system |
| `PHASE_7_INSTAGRAM.md` | Instagram Reels auto-posting via Graph API |

---

## When to Activate V2

After V1 is complete:
1. ✅ Twitch clip import working
2. ✅ YouTube clip import working
3. 📋 VOD highlight detection working
4. 📋 Multi-clip extraction working

Then:
1. Move these files to `PLANNING/v2-agency-phases/`
2. Update master plan with V2 roadmap
3. Begin V2 implementation

---

## Integration Points with V1

V2 builds on top of V1 services:

```
V1 Services (Keep)          V2 Services (Add)
├── scrapcreators-service   ├── whop-membership-service
├── drive-service           ├── clipper-service
├── youtube-service         ├── assignment-service
├── clip-workflow           ├── notification-service
├── youtube-workflow        ├── admin-service
└── vod-service             └── instagram-service  ← NEW
```

---

## Full Pipeline (V1 + V2)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FULL PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘

  CONTENT SOURCE              V1: IMPORT                 V2: DISTRIBUTE
  ─────────────────          ─────────────              ───────────────
  
  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
  │   Twitch    │──────────▶│             │           │  Instagram  │
  │   Clips     │           │             │──────────▶│   Reels     │
  └─────────────┘           │   Google    │           └─────────────┘
                            │   Drive     │
  ┌─────────────┐           │             │           ┌─────────────┐
  │  YouTube    │──────────▶│  (Organized │──────────▶│   TikTok    │
  │   Clips     │           │   Folders)  │           │  (Future)   │
  └─────────────┘           │             │           └─────────────┘
                            │             │
  ┌─────────────┐           │             │           ┌─────────────┐
  │    VOD      │──────────▶│             │──────────▶│  YouTube    │
  │  Detection  │           │             │           │   Shorts    │
  └─────────────┘           └─────────────┘           └─────────────┘
                                  │
                                  ▼
                            ┌─────────────┐
                            │   Clipper   │
                            │ Assignment  │
                            │   (V2)      │
                            └─────────────┘
```

---

## Instagram Auto-Post (Phase 7) Summary

**Requirements:**
- Instagram Business Account
- Facebook Developer App
- Instagram Graph API permissions

**What It Does:**
- Posts clips directly to Instagram Reels
- Two-step API process (container → publish)
- Supports custom captions and hashtags
- Can post from Drive files or import fresh

**Endpoints:**
```
POST /api/instagram/post           # Direct video URL
POST /api/instagram/import-and-post # Twitch → Drive → Instagram
POST /api/instagram/post-from-drive # Existing Drive file
```

See `PHASE_7_INSTAGRAM.md` for full implementation details.
