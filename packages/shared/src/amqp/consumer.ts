import type { Channel, ConsumeMessage } from "amqplib";
import { EXCHANGE } from "../events/types.js";
import type { DomainEvent } from "../events/types.js";
import { assertConsumerQueue } from "./topology.js";
import { alreadyProcessed } from "../idempotency/index.js";

export interface ConsumerOptions {
  queue: string;
  bindingKeys: string[];
  onEvent: (event: DomainEvent, raw: ConsumeMessage) => Promise<void>;
}

export async function consume(
  channel: Channel,
  options: ConsumerOptions
): Promise<void> {
  const { queue, bindingKeys, onEvent } = options;

  await assertConsumerQueue(channel, queue, bindingKeys);
  await channel.prefetch(10);

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as DomainEvent;

      if (await alreadyProcessed(queue, event.meta.id)) {
        console.log(`[${queue}] skipping duplicate ${event.meta.id}`);
        channel.ack(msg);
        return;
      }

      await onEvent(event, msg);
      channel.ack(msg);
    } catch (err) {
      console.error(`[${queue}] processing failed, dead-lettering`, err);
      channel.nack(msg, false, false);
    }
  });
}