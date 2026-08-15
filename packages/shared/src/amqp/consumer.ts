import type { Channel, ConsumeMessage } from "amqplib";
import { EXCHANGE } from "../events/types.js";
import type { DomainEvent } from "../events/types.js";

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

  await channel.assertQueue(queue, { durable: true });
  for (const key of bindingKeys) {
    await channel.bindQueue(queue, EXCHANGE.EVENTS, key);
  }

  await channel.prefetch(10);

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as DomainEvent;
      await onEvent(event, msg);
      channel.ack(msg);
    } catch (err) {
      console.error(`[${queue}] failed to process message`, err);
      channel.nack(msg, false, false);
    }
  });
}