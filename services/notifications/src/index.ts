import "dotenv/config";
import express from "express";
import {
  assertTopology,
  connect,
  consume,
  initIdempotency,
  EVENT,
  type DomainEvent,
  type UserCreatedPayload,
} from "@warren/shared";
import { prisma } from "./db.js";

async function handleEvent(event: DomainEvent): Promise<void> {
  let recipient = "system";
  let message = `event received: ${event.meta.name}`;

  if (event.meta.name === EVENT.USER_CREATED) {
    const payload = event.payload as UserCreatedPayload;
    recipient = payload.email;
    message = `Welcome to warren, ${payload.name}!`;
  }

  const notification = await prisma.notification.create({
    data: { eventName: event.meta.name, recipient, message },
  });

  console.log(
    `[notifications] ${notification.eventName} -> ${recipient}: ${message}`
  );
}

async function main() {
  const ctx = await connect();
  await initIdempotency();
  await assertTopology(ctx.channel);

  await consume(ctx.channel, {
    queue: "notifications.all-events",
    bindingKeys: ["#"],
    onEvent: handleEvent,
  });

  console.log("notifications service listening for all events");

  const app = express();
  app.get("/notifications", async (_req, res) => {
    const items = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(items);
  });
  const PORT = Number(process.env.NOTIFICATIONS_PORT ?? 3003);
  app.listen(PORT, () =>
    console.log(`notifications HTTP on http://localhost:${PORT}`)
  );
}

main().catch((err) => {
  console.error("failed to start notifications service", err);
  process.exit(1);
});