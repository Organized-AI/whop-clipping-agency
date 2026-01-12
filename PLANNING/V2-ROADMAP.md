# V2 Roadmap - Future Features

This document captures features planned for v2 of the Whop Clipping Agency.

---

## Planned Features

### 1. Meta API Integration (Instagram/Facebook)

**Priority:** High
**Complexity:** Medium-High
**Dependencies:** Phase 6 (Hardening) complete

#### Overview
Post clipped videos directly to Instagram Reels and Facebook Reels/Pages after uploading to Google Drive.

#### Workflow
```
Clip → Google Drive → Generate Public URL → Meta API → Instagram/Facebook
```

#### Requirements

| Requirement | Details |
|-------------|---------|
| **Account Types** | Instagram Business/Creator account, Facebook Page |
| **Meta App** | Create app at developers.facebook.com |
| **Permissions** | `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `publish_video` |
| **OAuth** | User authorization flow for token management |

#### Video Specifications

| Platform | Max Duration | Max Size | Aspect Ratio |
|----------|--------------|----------|--------------|
| Instagram Reels | 90 seconds | 100 MB | 9:16 recommended |
| Instagram Stories | 60 seconds | 100 MB | 9:16 |
| Facebook Reels | 90 seconds | 100 MB | 9:16 |
| Facebook Page Video | Hours | 10 GB | Various |

#### Technical Specs
- Container: MP4 or MOV
- Video codec: H.264
- Audio codec: AAC (48kHz max)
- Frame rate: 23-60 FPS

#### API Flow (Two-Step Publishing)
```typescript
// Step 1: Create container
POST /{ig-user-id}/media
  ?media_type=REELS
  &video_url={public-video-url}
  &caption={caption}
  &share_to_feed=true
// Returns: container_id

// Step 2: Wait for processing, then publish
POST /{ig-user-id}/media_publish
  ?creation_id={container_id}
// Returns: media_id
```

#### Challenges to Address
1. **Public URL requirement** - Drive files need public sharing or signed URLs
2. **Video format conversion** - ffmpeg to ensure H.264/AAC compliance
3. **OAuth token management** - Refresh tokens, secure storage
4. **Rate limiting** - 50 posts/day limit on Instagram
5. **Processing status polling** - Container processing can take time

#### Proposed Implementation

**New Files:**
- `src/config/meta-config.ts` - Meta API configuration
- `src/services/meta-auth.ts` - OAuth flow and token management
- `src/services/instagram-service.ts` - Instagram Reels publishing
- `src/services/facebook-service.ts` - Facebook Reels/Video publishing
- `src/api/meta.ts` - API routes for social posting
- `src/types/meta.ts` - Type definitions

**New Environment Variables:**
```env
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_PAGE_ID=
META_IG_USER_ID=
```

**API Endpoints:**
```
POST /api/meta/instagram/reel     - Post to Instagram Reels
POST /api/meta/facebook/reel      - Post to Facebook Reels
POST /api/meta/facebook/video     - Post to Facebook Page
GET  /api/meta/status/{id}        - Check publishing status
GET  /api/meta/auth/callback      - OAuth callback
```

#### Research Sources
- [Instagram Graph API Complete Guide 2025](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)
- [Instagram Reels API Guide](https://www.getphyllo.com/post/a-complete-guide-to-the-instagram-reels-api)
- [Posting Instagram Reels via Graph API](https://business-automated.medium.com/posting-instagram-reels-via-instagram-facebook-graph-api-9ea192d54dfa)
- [Facebook Reels API](https://www.ayrshare.com/facebook-reels-api-how-to-post-fb-reels-using-a-social-media-api/)

---

### 2. Audio Analysis for Highlight Detection

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** Phase 5 (VOD Detection) complete

#### Overview
Add audio signal analysis to improve highlight detection accuracy by detecting:
- Speech-to-silence ratios
- Volume spikes (enthusiasm indicators)
- Silence-before-spike patterns (setup → punchline)

#### Implementation
See `PLANNING/FUTURE-WORK.md` for detailed specification.

---

### 3. TikTok Integration

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** Meta API Integration

#### Overview
Extend social publishing to TikTok using their Content Posting API.

#### Notes
- TikTok requires separate app and OAuth flow
- Different video specs (up to 10 minutes)
- Separate rate limits

---

### 4. Multi-Platform Publishing Workflow

**Priority:** High (after Meta API)
**Complexity:** Low
**Dependencies:** Meta API, TikTok Integration

#### Overview
Single API call to publish to multiple platforms simultaneously.

```typescript
POST /api/publish
{
  "driveFileId": "xxx",
  "platforms": ["instagram", "facebook", "tiktok"],
  "caption": "Check out this clip!",
  "hashtags": ["coding", "dev"]
}
```

---

### 5. Whop Membership Integration

**Priority:** High
**Complexity:** Medium
**Dependencies:** Phase 6 (Hardening) - webhook handler

#### Overview
Full integration with Whop platform for:
- Membership-based access control
- Per-tier clip limits
- Usage tracking and billing
- Automatic Drive folder provisioning per member

See `.archive/v2-agency-management/` for original phased plan.

---

### 6. Database Integration

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** Whop Integration

#### Overview
Add PostgreSQL/Supabase for:
- Clip metadata storage
- User preferences
- Publishing history
- Analytics/reporting

---

## Implementation Order

Recommended sequence for v2 features:

1. **Phase 6: Hardening** (current v1 - in progress)
2. **Whop Membership Integration** - Enables monetization
3. **Meta API Integration** - High user value
4. **Database Integration** - Required for tracking
5. **TikTok Integration** - Extends reach
6. **Multi-Platform Publishing** - Convenience layer
7. **Audio Analysis** - Nice-to-have improvement

---

## Version Milestones

### v1.0 (Current)
- ✅ Twitch clip import
- ✅ YouTube clip/chapter import
- ✅ Highlight detection (transcript + motion)
- ✅ VOD multi-clip extraction
- ✅ Google Drive upload
- ⏳ Post-build hardening

### v2.0 (Planned)
- 🔲 Meta API (Instagram/Facebook)
- 🔲 Whop membership integration
- 🔲 Database persistence
- 🔲 Usage tracking

### v2.5 (Future)
- 🔲 TikTok integration
- 🔲 Multi-platform publishing
- 🔲 Audio analysis
- 🔲 Advanced analytics
