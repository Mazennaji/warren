export const RPC_QUEUE = {
  USERS: "rpc.users",
} as const;

export const RPC_METHOD = {
  IS_VERIFIED: "isVerified",
} as const;

export type RpcMethod = (typeof RPC_METHOD)[keyof typeof RPC_METHOD];

export interface RpcRequest {
  method: RpcMethod;
  params: Record<string, unknown>;
}

export interface RpcResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface IsVerifiedParams {
  userId: string;
}

export interface IsVerifiedResult {
  userId: string;
  verified: boolean;
}