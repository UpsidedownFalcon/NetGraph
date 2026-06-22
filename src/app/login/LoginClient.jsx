"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Constellation from "@/components/Constellation";

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace("/app");   // go to the app
        router.refresh();         // re-run server components so the new cookie is seen
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.wrap}>
      <Constellation />
      <form onSubmit={submit} style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.dot} />
          <span style={styles.title}>NetGraph</span>
        </div>
        <p style={styles.subtitle}>Sign in to view your network.</p>

        <label style={styles.label} className="mono">USERNAME</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />

        <label style={styles.label} className="mono">PASSWORD</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

const styles = {
  wrap: {
    position: "relative",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-deep)",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: 340,
    maxWidth: "90vw",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 14,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "var(--status-known)",
    boxShadow: "0 0 14px var(--glow-known)",
  },
  title: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" },
  subtitle: { color: "var(--text-secondary)", fontSize: 13, margin: "10px 0 22px" },
  label: { fontSize: 10, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 },
  input: {
    background: "var(--bg-elevated-2)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    color: "var(--text-primary)",
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 16,
    outline: "none",
  },
  error: { color: "var(--status-avoid)", fontSize: 13, marginBottom: 14 },
  button: {
    background: "var(--text-primary)",
    color: "var(--bg-deep)",
    border: "none",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 14,
    fontWeight: 600,
    marginTop: 4,
  },
};
