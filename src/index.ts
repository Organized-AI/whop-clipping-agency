import "dotenv/config";
import express from "express";
import clipsRouter from "./api/clips";
import youtubeRouter from "./api/youtube";

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

// Webhook placeholder (Phase 2)
app.post("/webhooks/whop", express.raw({ type: "application/json" }), (req, res) => {
  console.log("Webhook received:", req.headers["whop-event"]);
  res.status(200).json({ received: true });
});

// API Routes
app.use("/api/clips", clipsRouter);
app.use("/api/youtube", youtubeRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Twitch clips: POST http://localhost:${PORT}/api/clips/import`);
  console.log(`YouTube clips: POST http://localhost:${PORT}/api/youtube/import`);
});

export default app;
