import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const TTL_SECONDS = 60 * 60 * 24;

let client: RedisClientType | null = null;

export async function initIdempotency(): Promise<void> {
  client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.error("redis error", err));
  await client.connect();
}

export async function alreadyProcessed(
  consumer: string,
  eventId: string
): Promise<boolean> {
  if (!client) throw new Error("idempotency not initialized");
  const key = `processed:${consumer}:${eventId}`;
  const result = await client.set(key, "1", { NX: true, EX: TTL_SECONDS });
  return result === null;
}