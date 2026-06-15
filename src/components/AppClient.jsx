"use client";

import { useState, useEffect } from "react";
import GraphView from "@/components/GraphView";

export default function AppClient() {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/people");
      const data = await res.json();
      setPeople(data);
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) {
    return <p style={{ padding: 40, color: "var(--text-secondary)" }}>Loading…</p>;
  }

  return (
    <main style={{ height: "100%" }}>
      <GraphView people={people} />
    </main>
  );
} 
