import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { startBroadcaster } from "./broadcaster.js";

const PORT = Number(process.env.GATEWAY_PORT ?? 4000);
const USERS_URL = process.env.USERS_SERVICE_URL ?? "http://localhost:3001";
const BILLING_URL = process.env.BILLING_SERVICE_URL ?? "http://localhost:3002";
const NOTIFICATIONS_URL =
  process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:3003";

async function proxyGet(url: string, res: express.Response) {
  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ error: "upstream service unavailable" });
  }
}

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "gateway" });
  });

  app.post("/api/users", async (req, res) => {
    try {
      const upstream = await fetch(`${USERS_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch {
      res.status(502).json({ error: "users service unavailable" });
    }
  });

  app.get("/api/users", (_req, res) => proxyGet(`${USERS_URL}/users`, res));
  app.get("/api/customers", (_req, res) =>
    proxyGet(`${BILLING_URL}/customers`, res)
  );
  app.get("/api/notifications", (_req, res) =>
    proxyGet(`${NOTIFICATIONS_URL}/notifications`, res)
  );

  const server = http.createServer(app);
  await startBroadcaster(server);

  server.listen(PORT, () => {
    console.log(`gateway listening on http://localhost:${PORT}`);
    console.log(`WebSocket available on ws://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("failed to start gateway", err);
  process.exit(1);
});