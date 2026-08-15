import {
  assertTopology,
  connect,
  consume,
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
  await assertTopology(ctx.channel);

  await consume(ctx.channel, {
    queue: "notifications.all-events",
    bindingKeys: ["#"],
    onEvent: handleEvent,
  });

  console.log("notifications service listening for all events");
}

main().catch((err) => {
  console.error("failed to start notifications service", err);
  process.exit(1);
});