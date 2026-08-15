import { randomUUID } from "node:crypto";
import type { Channel, ConsumeMessage } from "amqplib";
import type { RpcRequest, RpcResponse } from "./types.js";

export type RpcHandler = (req: RpcRequest) => Promise<RpcResponse>;

export async function serveRpc(
  channel: Channel,
  queue: string,
  handler: RpcHandler
): Promise<void> {
  await channel.assertQueue(queue, { durable: false });
  await channel.prefetch(1);

  await channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    let response: RpcResponse;
    try {
      const req = JSON.parse(msg.content.toString()) as RpcRequest;
      response = await handler(req);
    } catch (err) {
      response = { ok: false, error: (err as Error).message };
    }

    const { replyTo, correlationId } = msg.properties;
    if (replyTo) {
      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
        correlationId: correlationId ?? randomUUID(),
        contentType: "application/json",
      });
    }
    channel.ack(msg);
  });
}