"use client";

import { useState, useEffect } from "react";
import { STATUS, STATUS_ORDER } from "@/lib/constants";

export default function DetailPopup({ person, mode, onClose, onSaved, onDeleted }) {
  const isCreate = mode === "create";

  // One piece of state per editable field, initialized from the person.
  const [name, setName] = useState(person.name || "");
  const [ask, setAsk] = useState(person.ask || "");
  const [status, setStatus] = useState(person.status || "to_contact");
  const [background, setBackground] = useState(person.background || "");
  const [howWeMet, setHowWeMet] = useState(person.how_we_met || "");
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
        await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
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
        <textarea style={styles.textarea} value={ask}
          onChange={(e) => setAsk(e.target.value)} placeholder="What I want from them" />

        <label style={styles.label} className="mono">BACKGROUND</label>
        <textarea style={styles.textarea} value={background}
          onChange={(e) => setBackground(e.target.value)} placeholder="Background" />

        <label style={styles.label} className="mono">HOW WE MET</label>
        <textarea style={styles.textarea} value={howWeMet}
          onChange={(e) => setHowWeMet(e.target.value)} placeholder="How we met" />

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
  textarea: {
    width: "100%", background: "var(--bg-elevated-2)", border: "1px solid var(--border-subtle)",
    borderRadius: 8, color: "var(--text-primary)", padding: "9px 11px", fontSize: 13.5,
    outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: 52, marginTop: 2,
  },
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
