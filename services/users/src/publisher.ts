import {
  assertTopology,
  connect,
  createEvent,
  EXCHANGE,
  type AmqpContext,
  type EventName,
  type EventPayloads,
} from "@warren/shared";

const SOURCE = "users";

let ctx: AmqpContext | null = null;

export async function initPublisher(): Promise<void> {
  ctx = await connect();
  await assertTopology(ctx.channel);
}

export function publish<T extends EventName>(
  name: T,
  payload: EventPayloads[T]
): void {
  if (!ctx) throw new Error("publisher not initialized");
  const event = createEvent(name, SOURCE, payload);
  ctx.channel.publish(
    EXCHANGE.EVENTS,
    name,
    Buffer.from(JSON.stringify(event)),
    { persistent: true, contentType: "application/json" }
  );
}