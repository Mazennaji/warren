import type { Channel } from "amqplib";
import { EXCHANGE } from "../events/types.js";

export async function assertTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(EXCHANGE.EVENTS, "topic", { durable: true });
  await channel.assertExchange(EXCHANGE.DLX, "topic", { durable: true });
}

export async function assertConsumerQueue(
  channel: Channel,
  queue: string,
  bindingKeys: string[]
): Promise<void> {
  const dlqName = `${queue}.dlq`;

  await channel.assertQueue(dlqName, { durable: true });
  await channel.bindQueue(dlqName, EXCHANGE.DLX, queue);

  await channel.assertQueue(queue, {
    durable: true,
    deadLetterExchange: EXCHANGE.DLX,
    deadLetterRoutingKey: queue,
  });

  for (const key of bindingKeys) {
    await channel.bindQueue(queue, EXCHANGE.EVENTS, key);
  }
}