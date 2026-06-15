"use client";

import { useState, useEffect, useCallback } from "react";
import GraphView from "@/components/GraphView";
import DetailPopup from "@/components/DetailPopup";

export default function AppClient() {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);  // which node is highlighted
  const [popup, setPopup] = useState(null);            // { mode, person } or null

  // Load people from the API. useCallback so it's a stable reference for the effect.
  const load = useCallback(async () => {
    const res = await fetch("/api/people");
    const data = await res.json();
    setPeople(data);
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

  if (!loaded) {
    return <p style={{ padding: 40, color: "var(--text-secondary)" }}>Loading…</p>;
  }

  return (
    <main style={{ height: "100%" }}>
      <GraphView
        people={people}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onPaneCreate={onPaneCreate}
        onOpenPerson={onOpenPerson}
      />

      {popup && (
        <DetailPopup
          person={popup.person}
          mode={popup.mode}
          onClose={() => setPopup(null)}
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
