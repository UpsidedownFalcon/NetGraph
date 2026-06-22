"use client";

import { useState, useEffect, useCallback } from "react";
import Constellation from "@/components/Constellation";
import GraphView from "@/components/GraphView";
import TableView from "@/components/TableView";
import DetailPopup from "@/components/DetailPopup";

export default function AppClient() {
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("graph");             // "graph" or "table"
  const [selectedId, setSelectedId] = useState(null);  // which node is highlighted
  const [popup, setPopup] = useState(null);            // { mode, person } or null

  // Load people AND relationships from the API in parallel.
  const load = useCallback(async () => {
    const [peopleRes, relRes] = await Promise.all([
      fetch("/api/people"),
      fetch("/api/relationships"),
    ]);
    setPeople(await peopleRes.json());
    setRelationships(await relRes.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Clicked empty canvas → open a "create" popup pre-positioned where they clicked.
  const onPaneCreate = useCallback((pos) => {
    setSelectedId(null);
    setPopup({
      mode: "create",
      person: { position_x: pos.x, position_y: pos.y, status: "to_contact" },
    });
  }, []);

  // Clicked a node → open an "edit" popup for that person.
  const onOpenPerson = useCallback((person) => {
    setPopup({ mode: "edit", person });
  }, []); 

   // Dragged a node → optimistically move it in state, and save the new position.
  const onMovePerson = useCallback((id, pos) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, position_x: pos.x, position_y: pos.y } : p))
    );
    fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position_x: pos.x, position_y: pos.y }),
    });
  }, []); 

  // Dragged a wire between two dots → create the relationship, then refresh.
  const onConnectPeople = useCallback(
    async (sourceId, targetId) => {
      await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
      });
      load();
    },
    [load]
  );

  // Removed a connection → delete it on the server, then refresh.
  const onDeleteRelationship = useCallback(
    async (id) => {
      await fetch(`/api/relationships/${id}`, { method: "DELETE" });
      load();
    },
    [load]
  );

  // Deleted a node (via keyboard) → remove it on the server, then refresh.
  const onDeletePerson = useCallback(
    async (id) => {
      await fetch(`/api/people/${id}`, { method: "DELETE" });
      if (selectedId === id) setSelectedId(null);
      load();
    },
    [load, selectedId]
  );

  if (!loaded) {
    return <p style={{ padding: 40, color: "var(--text-secondary)" }}>Loading…</p>;
  }

  return (
    <main style={styles.app}>
      <Constellation />

      <header style={styles.bar}>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          <span style={styles.brandName}>NetGraph</span>
        </div>
        <nav style={styles.tabs}>
          <button
            onClick={() => setTab("graph")}
            style={{ ...styles.tab, ...(tab === "graph" ? styles.tabActive : {}) }}
          >
            Graph
          </button>
          <button
            onClick={() => setTab("table")}
            style={{ ...styles.tab, ...(tab === "table" ? styles.tabActive : {}) }}
          >
            Table
          </button>
        </nav>
      </header>

      <section style={styles.body}>
        {tab === "graph" ? (
          <GraphView
            people={people}
            relationships={relationships}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPaneCreate={onPaneCreate}
            onOpenPerson={onOpenPerson}
            onConnectPeople={onConnectPeople}
            onMovePerson={onMovePerson}
            onDeletePerson={onDeletePerson}
            onDeleteRelationship={onDeleteRelationship}
          />
        ) : (
          <TableView people={people} onChanged={load} />
        )}
      </section>

      {popup && (
        <DetailPopup
          person={popup.person}
          mode={popup.mode}
          onClose={() => {
            setPopup(null);
            load(); // refresh so live-saved channels show on reopen
          }}
          onSaved={() => {
            setPopup(null);
            load();
          }}
          onDeleted={() => {
            setPopup(null);
            setSelectedId(null);
            load();
          }}
        />
      )}
    </main>
  );
}

const styles = {
  app: {
    position: "relative", height: "100%",
    display: "flex", flexDirection: "column", background: "var(--bg-deep)",
  },
  bar: {
    position: "relative", zIndex: 10,
    display: "flex", alignItems: "center", gap: 20,
    height: 52, padding: "0 16px",
    background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)",
  },
  brand: { display: "flex", alignItems: "center", gap: 9 },
  brandDot: {
    width: 10, height: 10, borderRadius: "50%",
    background: "var(--status-known)", boxShadow: "0 0 12px var(--glow-known)",
  },
  brandName: { fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" },
  tabs: { display: "flex", gap: 4, marginLeft: 8 },
  tab: {
    background: "transparent", border: "none", color: "var(--text-secondary)",
    padding: "6px 12px", fontSize: 13, borderRadius: 7, cursor: "pointer",
  },
  tabActive: { background: "var(--bg-elevated-2)", color: "var(--text-primary)" },
  // flex:1 + minHeight:0 lets the graph/table fill the remaining height correctly.
  body: { position: "relative", flex: 1, minHeight: 0 },
};

