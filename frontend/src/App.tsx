import { useEffect, useRef, useState } from "react";
import type { StreamEvent } from "./types";
import "./App.css";

const GATEWAY_HTTP = "http://localhost:4000";
const GATEWAY_WS = "ws://localhost:4000";

const EVENT_COLORS: Record<string, string> = {
  "user.created": "var(--signal)",
  "user.updated": "var(--signal)",
  "user.deleted": "var(--rose)",
  "payment.succeeded": "var(--green)",
  "payment.failed": "var(--rose)",
};

function eventColor(name: string): string {
  return EVENT_COLORS[name] ?? "var(--amber)";
}

export default function App() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let alive = true;
    function open() {
      const ws = new WebSocket(GATEWAY_WS);
      wsRef.current = ws;
      ws.onopen = () => alive && setConnected(true);
      ws.onclose = () => {
        if (!alive) return;
        setConnected(false);
        setTimeout(open, 1500);
      };
      ws.onmessage = (msg) => {
        const event = JSON.parse(msg.data) as StreamEvent;
        setEvents((prev) => [event, ...prev].slice(0, 100));
      };
    }
    open();
    return () => {
      alive = false;
      wsRef.current?.close();
    };
  }, []);

  async function createUser() {
    if (!email || !name) {
      setNotice("Enter a name and email first.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`${GATEWAY_HTTP}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        setNotice(err.error ?? "Could not create user.");
      } else {
        setEmail("");
        setName("");
      }
    } catch {
      setNotice("Gateway unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          warren
        </div>
        <div className={`status ${connected ? "on" : "off"}`}>
          <span className="dot" />
          {connected ? "bus connected" : "reconnecting"}
        </div>
      </header>

      <main className="grid">
        <section className="panel compose">
          <h2>Create a user</h2>
          <p className="hint">
            Publishes a <code>user.created</code> event. Watch it travel the bus.
          </p>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
            />
          </label>
          <button onClick={createUser} disabled={busy}>
            {busy ? "Publishing…" : "Create user"}
          </button>
          {notice && <p className="notice">{notice}</p>}
        </section>

        <section className="panel stream">
          <div className="stream-head">
            <h2>Live event stream</h2>
            <span className="count">{events.length}</span>
          </div>
          <div className="spine">
            {events.length === 0 && (
              <p className="empty">No events yet. Create a user to begin.</p>
            )}
            {events.map((ev) => (
              <article
                key={ev.meta.id}
                className="event"
                style={{ ["--accent" as string]: eventColor(ev.meta.name) }}
              >
                <div className="event-line">
                  <span className="event-name">{ev.meta.name}</span>
                  <span className="event-source">{ev.meta.source}</span>
                  <time>{new Date(ev.meta.timestamp).toLocaleTimeString()}</time>
                </div>
                <pre>{JSON.stringify(ev.payload, null, 2)}</pre>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}