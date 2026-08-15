export interface EventMeta {
  id: string;
  name: string;
  timestamp: string;
  source: string;
}

export interface StreamEvent {
  meta: EventMeta;
  payload: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  email: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  eventName: string;
  recipient: string;
  message: string;
  createdAt: string;
}