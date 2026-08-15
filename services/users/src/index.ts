import express from "express";
import { EVENT,
  RPC_QUEUE,
  RPC_METHOD,
  serveRpc,
  type RpcRequest,
  type RpcResponse,
  type IsVerifiedParams,
  connect
} from "@warren/shared";
import { prisma } from "./db.js";
import { initPublisher, publish } from "./publisher.js";

const PORT = Number(process.env.USERS_PORT ?? 3001);

async function main() {
  await initPublisher();

  const rpcCtx = await connect();
  await serveRpc(
    rpcCtx.channel,
    RPC_QUEUE.USERS,
    async (req: RpcRequest): Promise<RpcResponse> => {
      if (req.method === RPC_METHOD.IS_VERIFIED) {
        const { userId } = req.params as unknown as IsVerifiedParams;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { ok: false, error: "user not found" };
        return {
          ok: true,
          data: { userId: user.id, verified: user.verified },
        };
      }
      return { ok: false, error: `unknown method: ${req.method}` };
    }
  );
  console.log("users RPC server ready on", RPC_QUEUE.USERS);

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "users" });
  });

  app.post("/users", async (req, res) => {
    const { email, name } = req.body ?? {};
    if (!email || !name) {
      return res.status(400).json({ error: "email and name are required" });
    }

    try {
      const user = await prisma.user.create({ data: { email, name } });

      publish(EVENT.USER_CREATED, {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return res.status(201).json(user);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return res.status(409).json({ error: "email already exists" });
      }
      console.error(err);
      return res.status(500).json({ error: "internal error" });
    }
  });

  app.listen(PORT, () => {
    console.log(`users service listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("failed to start users service", err);
  process.exit(1);
});