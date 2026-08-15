import type { Channel } from "amqplib";
import { EXCHANGE } from "../events/types.js";

export async function assertTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(EXCHANGE.EVENTS, "topic", { durable: true });
  await channel.assertExchange(EXCHANGE.DLX, "topic", { durable: true });
}