import { randomUUID } from "node:crypto";
import type { Channel } from "amqplib";
import type { RpcRequest, RpcResponse } from "./types.js";

const DEFAULT_TIMEOUT_MS = 5000;

export async function callRpc<T = unknown>(
  channel: Channel,
  queue: string,
  request: RpcRequest,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RpcResponse<T>> {
  const { queue: replyQueue } = await channel.assertQueue("", {
    exclusive: true,
    autoDelete: true,
  });

  const correlationId = randomUUID();

  return new Promise<RpcResponse<T>>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`rpc timeout calling ${request.method}`));
    }, timeoutMs);

    channel
      .consume(
        replyQueue,
        (msg) => {
          if (!msg) return;
          if (msg.properties.correlationId !== correlationId) return;
          clearTimeout(timer);
          const response = JSON.parse(
            msg.content.toString()
          ) as RpcResponse<T>;
          resolve(response);
        },
        { noAck: true }
      )
      .catch(reject);

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(request)), {
      replyTo: replyQueue,
      correlationId,
      contentType: "application/json",
    });
  });
}