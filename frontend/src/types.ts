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