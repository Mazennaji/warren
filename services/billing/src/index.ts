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
  if (event.meta.name === EVENT.USER_CREATED) {
    const payload = event.payload as UserCreatedPayload;
    const customer = await prisma.customer.create({
      data: { userId: payload.userId, email: payload.email },
    });
    console.log(
      `[billing] created customer ${customer.id} for user ${payload.userId}`
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
    onEvent: handleEvent,
  });

  console.log("billing service listening for user.* events");
}

main().catch((err) => {
  console.error("failed to start billing service", err);
  process.exit(1);
});