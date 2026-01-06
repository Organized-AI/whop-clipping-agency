# Environment Configuration

## Required Variables

### Whop Configuration
| Variable | Description | Source |
|----------|-------------|--------|
| `WHOP_API_KEY` | API key for Whop SDK | Whop Developer Dashboard |
| `WHOP_APP_ID` | Your Whop app ID | Whop Developer Dashboard |
| `WHOP_WEBHOOK_SECRET` | Secret for webhook verification | Whop Webhook Settings |

### Google Drive
| Variable | Description | Source |
|----------|-------------|--------|
| `GOOGLE_CLIENT_ID` | OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Usually localhost:3000/auth/google/callback |
| `GOOGLE_ACCESS_TOKEN` | Access token (after auth) | OAuth flow |
| `GOOGLE_REFRESH_TOKEN` | Refresh token (after auth) | OAuth flow |
| `GOOGLE_DRIVE_PARENT_FOLDER` | Root folder ID | Google Drive |

### Database
| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard |

### Server
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `ADMIN_API_KEY` | Admin API auth key | Generate UUID |
| `ADMIN_USER_ID` | Whop user ID for admin notifications | Whop Dashboard |

## Setup Steps

### 1. Whop Setup
1. Go to Whop Developer Dashboard
2. Create or select your app
3. Copy API key and App ID
4. Set webhook URL to your server + /webhooks/whop
5. Copy webhook secret

### 2. Google Cloud Setup
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download JSON and extract client_id/secret
6. Run OAuth flow to get access/refresh tokens

### 3. Database Setup
1. Create Supabase project
2. Copy connection string from Settings > Database
3. Run migrations (when available)
