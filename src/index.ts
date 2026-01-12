import "dotenv/config";
import express from "express";
import { execSync } from "child_process";
import clipsRouter from "./api/clips";
import youtubeRouter from "./api/youtube";
import vodRouter from "./api/vod";
import whopWebhookRouter from "./webhooks/whop-handler";

/**
 * Validate required environment variables and dependencies at startup
 */
function validateStartup(): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required for core functionality
  if (!process.env.SCRAPCREATORS_API_KEY) {
    errors.push("SCRAPCREATORS_API_KEY is required for clip fetching");
  }
  if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER) {
    errors.push("GOOGLE_DRIVE_PARENT_FOLDER is required for uploads");
  }

  // Check for service account file
  const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "./config/service-account.json";
  try {
    require("fs").accessSync(saPath, require("fs").constants.R_OK);
  } catch {
    errors.push(`Google service account file not found at ${saPath}`);
  }

  // Optional but recommended
  if (!process.env.WHOP_API_KEY) {
    warnings.push("WHOP_API_KEY not set - Whop integration disabled");
  }
  if (!process.env.WHOP_WEBHOOK_SECRET) {
    warnings.push("WHOP_WEBHOOK_SECRET not set - webhook verification disabled");
  }

  // Check for required CLI tools
  const requiredTools = ["yt-dlp", "ffmpeg"];
  for (const tool of requiredTools) {
    try {
      execSync(`which ${tool}`, { stdio: "ignore" });
    } catch {
      errors.push(`Required tool '${tool}' not found in PATH`);
    }
  }

  return { warnings, errors };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "whop-clipping-agency",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Legacy root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "whop-clipping-agency",
    version: "0.1.0",
  });
});

// Webhook Routes (supports both raw body for signature verification)
app.use("/webhooks/whop", express.json(), whopWebhookRouter);

// API Routes
app.use("/api/clips", clipsRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/vod", vodRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Startup validation and server launch
const { warnings, errors } = validateStartup();

// Log warnings
warnings.forEach(w => console.warn(`⚠️  ${w}`));

// Fail on errors in production
if (errors.length > 0) {
  console.error("\n❌ Startup validation failed:");
  errors.forEach(e => console.error(`   - ${e}`));

  if (process.env.NODE_ENV === "production") {
    console.error("\nExiting due to missing configuration.");
    process.exit(1);
  } else {
    console.warn("\n⚠️  Running in development mode with missing configuration.");
  }
}

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health check: GET /health`);
  console.log(`   Twitch clips: POST /api/clips/import`);
  console.log(`   YouTube clips: POST /api/youtube/import`);
  console.log(`   VOD detection: POST /api/vod/detect`);
  console.log(`   VOD extract: POST /api/vod/detect-and-extract`);
  console.log(`   Whop webhooks: POST /webhooks/whop\n`);
});

export default app;
