import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
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

// API placeholder (Phase 5)
app.use("/api", (req, res) => {
  res.json({ message: "API coming in Phase 5" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Clipping Agency server running on port ${PORT}`);
});
