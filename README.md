# warren

> Event-driven microservices on RabbitMQ — a study in loose coupling, resilient messaging, and type-safe event contracts.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-black)](./LICENSE)

Three independent services — **users**, **billing**, and **notifications** — that never call each other directly. They communicate purely through events flowing across a RabbitMQ message bus, demonstrating the patterns that keep distributed systems decoupled and resilient under failure. A React dashboard visualizes messages moving through the bus in real time.

---

## Why this exists

Most tutorials show *how* to publish a message. Few show what it takes to run event-driven services responsibly: what happens when a consumer crashes mid-message, when the same event arrives twice, or when one service needs a synchronous answer from another. `warren` is built to make those problems visible and to solve them deliberately.

## Patterns demonstrated

- **Publish / subscribe** — the users service publishes events; billing and notifications react independently, with no knowledge of each other.
- **Topic routing** — a single topic exchange routes by pattern. Billing binds `user.*`; notifications binds `#` (everything). Same event, different reactions.
- **Dead-letter queues** — messages that fail processing are routed to a dedicated DLQ instead of being lost, so failures can be inspected and replayed.
- **Idempotent consumers** — a Redis-backed dedup layer makes reprocessing a redelivered message safe, handling RabbitMQ's at-least-once delivery guarantee.
- **RPC over AMQP** — for the rare synchronous call, billing asks the users service "is this account verified?" using `replyTo` and `correlationId`, and waits for the answer — without a direct dependency.
- **Gateway / BFF** — a gateway proxies REST calls to the services and bridges the bus to the browser over WebSockets.
- **Live dashboard** — a React UI streams every event in real time and shows each service's own view of the data.

## Architecture

| Component | Responsibility |
| --- | --- |
| **users** | Owns the user lifecycle. Publishes `user.created`. Serves an RPC verification query. |
| **billing** | Reacts to `user.*`. Runs an RPC check, then provisions a customer record. |
| **notifications** | Subscribes to all events. Records a notification per event. |
| **gateway** | REST entry point for the frontend; streams the bus to the browser over WebSockets. |
| **frontend** | React dashboard: create users, watch the live event stream, view per-service data. |
| **shared** | Typed event contracts, AMQP helpers, idempotency, and RPC primitives used by every service. |

Every event carries a metadata envelope (`id`, `name`, `timestamp`, `source`) alongside its payload. The `id` powers idempotency; the routing key drives topic subscriptions. No service shares a database table with another — consistency is maintained purely through events.

## Tech stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript, end to end |
| Message broker | RabbitMQ (with management UI) |
| Datastores | PostgreSQL (a schema per service), Redis (idempotency) |
| Frontend | React + Vite |
| Transport to browser | WebSockets (`ws`) |
| ORM | Prisma |
| Orchestration | Docker Compose |
| Monorepo tooling | npm workspaces |

## Getting started

**Prerequisites:** Node 20+ and Docker.

**1. Start the infrastructure** (RabbitMQ, PostgreSQL, Redis):

```bash
cp .env.example .env
npm install
docker compose up -d rabbitmq postgres redis
```

**2. Apply database migrations** (one time, and after any schema change):

```bash
npm run prisma:migrate -w @warren/users
npm run prisma:migrate -w @warren/billing
npm run prisma:migrate -w @warren/notifications
```

**3. Run the services** — each in its own terminal:

```bash
npm run dev -w @warren/users
npm run dev -w @warren/billing
npm run dev -w @warren/notifications
npm run dev -w @warren/gateway
npm run dev -w @warren/frontend
```

**4. Open the dashboard** at **http://localhost:5173**.

Create a user and watch the `user.created` event appear in the live stream while billing and notifications react in their terminals.

Useful endpoints:

- Dashboard — http://localhost:5173
- Gateway (REST + WebSocket) — http://localhost:4000
- RabbitMQ management UI — http://localhost:15672 (`admin` / `admin`)

## Project layout

| Path | Contents |
| --- | --- |
| `packages/shared` | Event contracts, AMQP helpers, idempotency, RPC |
| `services/users` | User service (HTTP + publisher + RPC server) |
| `services/billing` | Billing consumer (+ RPC client, read API) |
| `services/notifications` | Notification consumer (+ read API) |
| `gateway` | REST proxy + WebSocket event bridge |
| `frontend` | React live dashboard |

## Known simplifications

These are deliberate scope choices, not oversights — each has a well-understood production fix.

- **Save-then-publish gap.** A service writes to its database and then publishes an event as two separate steps. If the process dies between them, the write happens but the event is never sent. The production fix is the transactional outbox pattern.
- **Per-call RPC reply queues.** The RPC client creates a temporary reply queue per call. A production client caches one reply queue per process and multiplexes by `correlationId`.
- **Decoupling is real.** If billing is offline when a user is created, the user still exists — billing simply provisions the customer whenever it comes back and processes the queued event. (You'll notice this if you query the services after running some of them independently.)

## License

Released under the MIT License. See [`LICENSE`](./LICENSE).