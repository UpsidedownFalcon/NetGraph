"use client";

import { useState, useEffect, useCallback } from "react";
import GraphView from "@/components/GraphView";
import DetailPopup from "@/components/DetailPopup";

export default function AppClient() {
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]); 
  const [loaded, setLoaded] = useState(false);
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
    <main style={{ height: "100%" }}>
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
