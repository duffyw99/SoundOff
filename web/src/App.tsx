import { useEffect, useState } from 'react';

type ServerStatus = 'checking' | 'ok' | 'unreachable';

/** Placeholder screen. Real screens arrive in Milestone 1 onward. */
export function App() {
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/healthz')
      .then((res) => (res.ok ? 'ok' : 'unreachable'))
      .catch(() => 'unreachable')
      .then((next) => {
        if (!cancelled) setStatus(next as ServerStatus);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="shell">
      <h1>SoundOff!</h1>
      <p>Pick a song for the theme. Vote on everyone else’s. Find out who had the best taste.</p>
      <p className="status" data-status={status}>
        Server: {status}
      </p>
    </main>
  );
}
