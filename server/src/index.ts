import express from "express";
import { GameSession } from "./models/GameSession";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const sessions = new Map<string, GameSession>();

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start new session
app.post("/api/start-session", (req, res) => {
  const sessionId = Math.random().toString(36).substring(7);
  const session = new GameSession(sessionId);
  sessions.set(sessionId, session);
  res.json({ sessionId, credits: session.getCredits() });
});

// Roll the slots
app.post("/api/roll", (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const result = session.roll();

  if ("error" in result) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Cash out
app.post("/api/cash-out", (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const finalCredits = session.cashOut();
  sessions.delete(sessionId);
  res.json({ finalCredits });
});

export const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
