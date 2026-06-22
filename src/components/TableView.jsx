"use client";

import { useState } from "react";
import { STATUS, STATUS_ORDER, channelLabel } from "@/lib/constants";

// A spreadsheet-style view of everyone. It reads the same `people` data as the
// graph and saves through the same /api/people/:id endpoint, so edits here show
// up on the graph after `onChanged` triggers a reload in AppClient.
export default function TableView({ people, onChanged }) {
  const [savingId, setSavingId] = useState(null);

  // PATCH a single field of one person, then ask the parent to reload.
  async function patch(id, field, value) {
    setSavingId(id);
    await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSavingId(null);
    onChanged();
  }

  async function remove(id) {
    if (!confirm("Delete this person? Their connections will be removed too.")) return;
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div style={styles.wrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th} className="mono">STATUS</th>
            <th style={styles.th} className="mono">NAME</th>
            <th style={styles.th} className="mono">MY ASK</th>
            <th style={styles.th} className="mono">BACKGROUND</th>
            <th style={styles.th} className="mono">HOW WE MET</th>
            <th style={styles.th} className="mono">CHANNELS</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>
                <select
                  value={p.status}
                  onChange={(e) => patch(p.id, "status", e.target.value)}
                  style={styles.statusSelect}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS[s].label}</option>
                  ))}
                </select>
              </td>
              <Cell value={p.name} onSave={(v) => patch(p.id, "name", v)} bold />
              <Cell value={p.ask} onSave={(v) => patch(p.id, "ask", v)} />
              <Cell value={p.background} onSave={(v) => patch(p.id, "background", v)} />
              <Cell value={p.how_we_met} onSave={(v) => patch(p.id, "how_we_met", v)} />
              <td style={{ ...styles.td, color: "var(--text-secondary)" }}>
                {(p.channels || []).length === 0
                  ? "—"
                  : p.channels
                      .map((c) => `${channelLabel(c.channel)}${c.handle ? ` (${c.handle})` : ""}`)
                      .join(", ")}
              </td>
              <td style={styles.td}>
                <button style={styles.del} onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {people.length === 0 && (
            <tr>
              <td style={{ ...styles.td, color: "var(--text-muted)" }} colSpan={7}>
                No people yet — add some on the Graph tab.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// One editable text cell. Keeps its own draft value and only saves on blur,
// and only if the value actually changed.
function Cell({ value, onSave, bold }) {
  const [v, setV] = useState(value ?? "");
  return (
    <td style={styles.td}>
      <input
        className="cell-input"
        value={v}
        placeholder="Click to edit…"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
        style={{ fontWeight: bold ? 600 : 400 }}
      />
    </td>
  );
}

const styles = {
  wrap: { position: "relative", zIndex: 1, height: "100%", overflow: "auto", padding: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: "var(--text-muted)",
    fontWeight: 500, padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)",
    position: "sticky", top: 0, background: "var(--bg-deep)",
  },
  tr: { borderBottom: "1px solid var(--border-subtle)" },
  td: { padding: "4px 6px", verticalAlign: "middle" },
  statusSelect: {
    background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)", borderRadius: 6, padding: "6px 8px", fontSize: 12.5, outline: "none",
  },
  del: {
    background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--status-avoid)",
    borderRadius: 6, padding: "5px 10px", fontSize: 12,
  },
};
