"use client";

import { useState, useEffect } from "react";
import { STATUS, STATUS_ORDER, CHANNELS } from "@/lib/constants";
import MarkdownField from "./MarkdownField";

export default function DetailPopup({ person, mode, onClose, onSaved, onDeleted }) {
  const isCreate = mode === "create";

  // One piece of state per editable field, initialized from the person.
  const [name, setName] = useState(person.name || "");
  const [ask, setAsk] = useState(person.ask || "");
  const [status, setStatus] = useState(person.status || "to_contact");
  const [background, setBackground] = useState(person.background || "");
  const [howWeMet, setHowWeMet] = useState(person.how_we_met || "");
  const [channels, setChannels] = useState(person.channels || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Close the popup when Escape is pressed.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        ask,
        status,
        background,
        how_we_met: howWeMet,
        position_x: person.position_x ?? 0,
        position_y: person.position_y ?? 0,
      };
      if (isCreate) {
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();
        // The person exists now, so persist any channels added in the form.
        for (const c of channels) {
          const cRes = await fetch(`/api/people/${saved.id}/channels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          });
          if (!cRes.ok) throw new Error(`channel save failed (HTTP ${cRes.status})`);
        }
      } else {
        await fetch(`/api/people/${person.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch {
      setError("Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function removePerson() {
    if (isCreate) return onClose();
    if (!confirm("Delete this person?")) return;
    await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    onDeleted();
  }

  // Add a blank channel row. In edit mode, create it on the server right away.
  async function addChannel() {
    const newChannel = { channel: "email", handle: "", is_primary: 0 };
    if (isCreate) {
      setChannels([...channels, newChannel]);
      return;
    }
    try {
      const res = await fetch(`/api/people/${person.id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChannel),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();   // includes the new id
      setChannels([...channels, created]);
    } catch (err) {
      setError(`Could not add channel (${err.message})`);
    }
  }

  // Edit one field of a channel row. Update local state, then save if it's a real (saved) row.
  async function patchChannel(idx, patch) {
    const next = channels.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setChannels(next);
    if (!isCreate && next[idx].id) {
      await fetch(`/api/channels/${next[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    }
  }

  // Remove a channel row, and delete it on the server if it was saved.
  async function removeChannel(idx) {
    const c = channels[idx];
    setChannels(channels.filter((_, i) => i !== idx));
    if (!isCreate && c.id) {
      await fetch(`/api/channels/${c.id}`, { method: "DELETE" });
    }
  }

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={styles.card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <input
            style={styles.nameInput}
            value={name}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            autoFocus={isCreate}
          />
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <label style={styles.label} className="mono">STATUS</label>
        <div style={styles.swatches}>
          {STATUS_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              title={STATUS[key].label}
              style={{
                ...styles.swatch,
                background: STATUS[key].color,
                boxShadow:
                  status === key
                    ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${STATUS[key].color}`
                    : "none",
                opacity: status === key ? 1 : 0.55,
              }}
            />
          ))}
          <span style={styles.statusLabel}>{STATUS[status].label}</span>
        </div>

        <label style={styles.label} className="mono">MY ASK</label>
        <MarkdownField
          value={ask}
          onChange={setAsk}
          placeholder="What I want from them (markdown supported)"
          minHeight={44}
        />

        <label style={styles.label} className="mono">BACKGROUND</label>
        <MarkdownField
          value={background}
          onChange={setBackground}
          placeholder="Background (markdown supported — try - bullet points)"
          minHeight={64}
        />

        <label style={styles.label} className="mono">HOW WE MET</label>
        <MarkdownField
          value={howWeMet}
          onChange={setHowWeMet}
          placeholder="How we met (markdown supported)"
          minHeight={48}
        />

        <div style={styles.channelsHead}>
          <label style={styles.label} className="mono">CHANNELS</label>
          <button style={styles.addBtn} onClick={addChannel}>+ Add</button>
        </div>
        {channels.length === 0 && <div style={styles.empty}>No channels yet.</div>}
        {channels.map((c, i) => (
          <div key={c.id ?? i} style={styles.channelRow}>
            <select style={styles.channelSelect} value={c.channel}
              onChange={(e) => patchChannel(i, { channel: e.target.value })}>
              {CHANNELS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input style={styles.channelInput} value={c.handle || ""} placeholder="handle"
              onChange={(e) => patchChannel(i, { handle: e.target.value })} />
            <button
              title="Primary channel"
              onClick={() => patchChannel(i, { is_primary: c.is_primary ? 0 : 1 })}
              style={{ ...styles.starBtn, color: c.is_primary ? "var(--status-contact)" : "var(--text-muted)" }}
            >★</button>
            <button style={styles.iconBtn} onClick={() => removeChannel(i)} aria-label="Remove">×</button>
          </div>
        ))}

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          {!isCreate && <button style={styles.deleteBtn} onClick={removePerson}>Delete</button>}
          <div style={{ flex: 1 }} />
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Saving…" : isCreate ? "Add person" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 50,
    background: "rgba(4,5,8,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: {
    width: 380, maxWidth: "92vw", maxHeight: "86vh", overflowY: "auto",
    background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
    borderRadius: 14, padding: 20, boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
  },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  nameInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "var(--text-primary)", fontSize: 18, fontWeight: 600,
    borderBottom: "1px solid var(--border-subtle)", padding: "4px 2px",
  },
  label: { display: "block", fontSize: 10, letterSpacing: "0.12em", color: "var(--text-muted)", margin: "14px 0 6px" },
  swatches: { display: "flex", alignItems: "center", gap: 10 },
  swatch: { width: 18, height: 18, borderRadius: "50%", border: "none", cursor: "pointer" },
  statusLabel: { marginLeft: 6, fontSize: 13, color: "var(--text-secondary)" },
  channelsHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  addBtn: {
    background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
    borderRadius: 6, padding: "3px 9px", fontSize: 12, marginTop: 8, cursor: "pointer",
  },
  empty: { color: "var(--text-muted)", fontSize: 12.5, margin: "4px 0" },
  channelRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 8 },
  channelSelect: {
    background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)",
    borderRadius: 6, padding: "7px 8px", fontSize: 12.5, outline: "none",
  },
  channelInput: {
    flex: 1, background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)", borderRadius: 6, padding: "7px 9px", fontSize: 12.5, outline: "none",
  },
  starBtn: { background: "transparent", border: "none", fontSize: 16, lineHeight: 1, padding: 2, cursor: "pointer" },
  iconBtn: { background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 20, lineHeight: 1, padding: "2px 6px", cursor: "pointer" },
  error: { color: "var(--status-avoid)", fontSize: 13, marginTop: 12 },
  footer: { display: "flex", alignItems: "center", gap: 8, marginTop: 20 },
  deleteBtn: {
    background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--status-avoid)",
    borderRadius: 8, padding: "8px 12px", fontSize: 13,
  },
  cancelBtn: {
    background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
    borderRadius: 8, padding: "8px 14px", fontSize: 13,
  },
  saveBtn: {
    background: "var(--text-primary)", color: "var(--bg-deep)", border: "none",
    borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600,
  },
}; 
