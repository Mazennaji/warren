import "dotenv/config";
import express from "express";
import type { Channel } from "amqplib";
import {
  assertTopology,
  connect,
  consume,
  initIdempotency,
  callRpc,
  EVENT,
  RPC_QUEUE,
  RPC_METHOD,
  type DomainEvent,
  type UserCreatedPayload,
  type IsVerifiedResult,
} from "@warren/shared";
import { prisma } from "./db.js";

async function handleEvent(
  event: DomainEvent,
  channel: Channel
): Promise<void> {
  if (event.meta.name === EVENT.USER_CREATED) {
    const payload = event.payload as UserCreatedPayload;

    const res = await callRpc<IsVerifiedResult>(channel, RPC_QUEUE.USERS, {
      method: RPC_METHOD.IS_VERIFIED,
      params: { userId: payload.userId },
    });

    const verified = res.ok ? res.data?.verified : false;
    console.log(
      `[billing] RPC says user ${payload.userId} verified=${verified}`
    );

    const customer = await prisma.customer.create({
      data: { userId: payload.userId, email: payload.email },
    });
    console.log(
      `[billing] created customer ${customer.id} (verified=${verified})`
    );
  }
}

async function main() {
  const ctx = await connect();
  await initIdempotency();
  await assertTopology(ctx.channel);

  await consume(ctx.channel, {
    queue: "billing.user-events",
    bindingKeys: ["user.*"],
    onEvent: (event) => handleEvent(event, ctx.channel),
  });

  console.log("billing service listening for user.* events");

  const app = express();
  app.get("/customers", async (_req, res) => {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(customers);
  });
  const PORT = Number(process.env.BILLING_PORT ?? 3002);
  app.listen(PORT, () =>
    console.log(`billing HTTP on http://localhost:${PORT}`)
  );
}

main().catch((err) => {
  console.error("failed to start billing service", err);
  process.exit(1);
});