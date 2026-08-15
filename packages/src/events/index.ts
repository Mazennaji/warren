import { randomUUID } from "node:crypto";
import type {
  DomainEvent,
  EventName,
  EventPayloads,
} from "./types.js";

export * from "./types.js";

export function createEvent<T extends EventName>(
  name: T,
  source: string,
  payload: EventPayloads[T]
): DomainEvent<T> {
  return {
    meta: {
      id: randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      source,
    },
    payload,
  };
}