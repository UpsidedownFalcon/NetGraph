"use client";

import { useState, useEffect } from "react";

export default function AppClient() {
  const [people, setPeople] = useState([]);   // the list, starts empty
  const [loaded, setLoaded] = useState(false); // have we finished the first load?

  // Load the people once, when this component first mounts.
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/people");
      const data = await res.json();
      setPeople(data);     // store the result in state → triggers a re-render
      setLoaded(true);     // mark loading as done
    }
    load();
  }, []); // empty array = run only once

  if (!loaded) {
    return <p style={{ padding: 40, color: "var(--text-secondary)" }}>Loading…</p>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>People ({people.length})</h1>
      {people.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No people yet.</p>
      ) : (
        <ul style={{ lineHeight: 1.8 }}>
          {people.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> — {p.status}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
} 
