# warren

> Event-driven microservices on RabbitMQ — a study in loose coupling, resilient messaging, and type-safe event contracts.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-black)](./LICENSE)

Three independent services — **users**, **billing**, and **notifications** — that never call each other directly. They communicate purely through events flowing across a RabbitMQ message bus, demonstrating the patterns that keep distributed systems decoupled and resilient under failure. A React frontend visualizes messages moving through the bus in real time.

---

## Why this exists

Most tutorials show *how* to publish a message. Few show what it takes to run event-driven services responsibly: what happens when a consumer crashes mid-message, when the same event arrives twice, or when one service needs a synchronous answer from another. `warren` is built to make those problems visible and to solve them deliberately.

## Highlights

- **Pure event-driven architecture** — services share no code paths and hold no references to one another; the only contract is the event.
- **Type-safe event contracts** — every event is defined once in a shared package and imported by publishers, consumers, the gateway, and the frontend.
- **Resilient messaging** — dead-letter queues capture poison messages; idempotent consumers make redelivery safe.
- **RPC-over-AMQP** — request/response messaging for the rare cases that genuinely need a synchronous answer.
- **Live observability** — a WebSocket gateway streams every event to a React dashboard as it happens.
- **One-command environment** — the entire stack runs under Docker Compose.

## Architecture

| Component | Responsibility |
| --- | --- |
| **users** | Owns user lifecycle; publishes `user.created`, `user.updated`, `user.deleted`. |
| **billing** | Reacts to user events to provision customers; publishes payment outcomes. |
| **notifications** | Subscribes broadly and dispatches messages on relevant events. |
| **gateway** | REST entry point for the frontend; bridges the event bus to the browser over WebSockets. |
| **frontend** | React interface with forms and a live event-stream view. |
| **shared** | Event contracts and AMQP connection helpers consumed by every service. |

Events flow through RabbitMQ exchanges; each service binds its own queues. No service depends on another being online to accept work — messages wait in the broker until a consumer is ready.

## Tech stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript, end to end |
| Message broker | RabbitMQ (with management UI) |
| Datastores | PostgreSQL (per service), Redis (idempotency & cache) |
| Frontend | React + Vite |
| Transport to browser | WebSockets |
| Orchestration | Docker Compose |
| Monorepo tooling | npm workspaces |

## Getting started

**Prerequisites:** Node 20+ and Docker.

```bash
# 1. Configure environment
cp .env.example .env

# 2. Install workspace dependencies
npm install

# 3. Start infrastructure (RabbitMQ, PostgreSQL, Redis)
npm run up
```

Open the RabbitMQ management UI at **http://localhost:15672** — default credentials are `guest` / `guest`.

Stop everything with `npm run down`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run up` | Start infrastructure in the background |
| `npm run down` | Stop and remove containers |
| `npm run logs` | Tail container logs |
| `npm run build` | Build every workspace that defines a build step |
| `npm run dev` | Run every workspace in development mode |

## Project layout

| Path | Contents |
| --- | --- |
| `packages/shared` | Event contracts and AMQP helpers |
| `services/users` | User service |
| `services/billing` | Billing service |
| `services/notifications` | Notification service |
| `gateway` | REST + WebSocket backend-for-frontend |
| `frontend` | React live event-stream UI |

## Roadmap

| Status | Milestone |
| --- | --- |
| ✅ | **Step 0** — Scaffolding, workspaces, infrastructure online |
| ⬜ | **Step 1** — Shared event contracts and AMQP connection helper |
| ⬜ | **Step 2** — Users service publishing lifecycle events |
| ⬜ | **Step 3** — Billing and notification consumers |
| ⬜ | **Step 4** — Dead-letter queues and idempotent consumers |
| ⬜ | **Step 5** — RPC-over-AMQP |
| ⬜ | **Step 6** — Gateway (REST + WebSocket) |
| ⬜ | **Step 7** — React frontend with live event stream |

## License

Released under the MIT License. See [`LICENSE`](./LICENSE) for details.