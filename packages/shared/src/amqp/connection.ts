import amqp from "amqplib";
import type { Channel, ChannelModel } from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

export interface AmqpContext {
  connection: ChannelModel;
  channel: Channel;
}

export async function connect(
  retries = 10,
  delayMs = 3000
): Promise<AmqpContext> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      return { connection, channel };
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
}

export async function close(ctx: AmqpContext): Promise<void> {
  await ctx.channel.close();
  await ctx.connection.close();
}