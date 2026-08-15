import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import {
  assertTopology,
  connect,
  EXCHANGE,
  type DomainEvent,
} from "@warren/shared";

export async function startBroadcaster(server: Server): Promise<void> {
  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const ctx = await connect();
  await assertTopology(ctx.channel);

  const { queue } = await ctx.channel.assertQueue("", {
    exclusive: true,
    autoDelete: true,
  });
  await ctx.channel.bindQueue(queue, EXCHANGE.EVENTS, "#");

  await ctx.channel.consume(
    queue,
    (msg) => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString()) as DomainEvent;
      const data = JSON.stringify(event);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    },
    { noAck: true }
  );

  console.log("broadcaster subscribed to bus, streaming to WebSocket clients");
}