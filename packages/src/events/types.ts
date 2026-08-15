export const EXCHANGE = {
  EVENTS: "warren.events",
  DLX: "warren.dlx",
} as const;

export const EVENT = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
} as const;

export type EventName = (typeof EVENT)[keyof typeof EVENT];

export interface EventMetadata {
  id: string;
  name: EventName;
  timestamp: string;
  source: string;
}

export interface UserCreatedPayload {
  userId: string;
  email: string;
  name: string;
}

export interface UserUpdatedPayload {
  userId: string;
  email?: string;
  name?: string;
}

export interface UserDeletedPayload {
  userId: string;
}

export interface PaymentSucceededPayload {
  userId: string;
  customerId: string;
  amount: number;
}

export interface PaymentFailedPayload {
  userId: string;
  reason: string;
}

export interface EventPayloads {
  [EVENT.USER_CREATED]: UserCreatedPayload;
  [EVENT.USER_UPDATED]: UserUpdatedPayload;
  [EVENT.USER_DELETED]: UserDeletedPayload;
  [EVENT.PAYMENT_SUCCEEDED]: PaymentSucceededPayload;
  [EVENT.PAYMENT_FAILED]: PaymentFailedPayload;
}

export type DomainEvent<T extends EventName = EventName> = {
  meta: EventMetadata;
  payload: EventPayloads[T];
};