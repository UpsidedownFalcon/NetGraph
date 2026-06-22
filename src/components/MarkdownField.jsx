"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

// A notes field with two modes: "Write" (a plain textarea) and "Preview"
// (the same text rendered as markdown). Starts in Preview if there's content.
export default function MarkdownField({ value, onChange, placeholder, minHeight = 56 }) {
  const [mode, setMode] = useState(value ? "preview" : "write");

  return (
    <div style={{ marginTop: 2 }}>
      <div style={styles.toggle}>
        <button
          type="button"
          onClick={() => setMode("write")}
          style={{ ...styles.tab, ...(mode === "write" ? styles.tabActive : {}) }}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          style={{ ...styles.tab, ...(mode === "preview" ? styles.tabActive : {}) }}
        >
          Preview
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...styles.textarea, minHeight }}
        />
      ) : value ? (
        <div className="markdown" style={{ ...styles.preview, minHeight }}>
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <div style={{ ...styles.preview, minHeight, color: "var(--text-muted)" }}>
          Nothing yet — switch to Write to add notes (markdown supported).
        </div>
      )}
    </div>
  );
}

const styles = {
  toggle: { display: "flex", gap: 4, marginBottom: 6 },
  tab: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
  },
  tabActive: { background: "var(--bg-elevated-2)", color: "var(--text-primary)" },
  textarea: {
    width: "100%",
    background: "var(--bg-elevated-2)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    color: "var(--text-primary)",
    padding: "9px 11px",
    fontSize: 13.5,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  preview: {
    width: "100%",
    background: "var(--bg-elevated-2)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 13.5,
  },
};
