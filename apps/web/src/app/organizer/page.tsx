"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, setStoredUser, setToken, type EventData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

const DEMO_EVENT_ID = "10000000-0000-0000-0000-000000000001";

export default function OrganizerPage() {
  const router = useRouter();
  const { locale } = useApp();
  const [email, setEmail] = useState("organizer@hirnao.app");
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.organizerLogin(email);
      if (result.user.role !== "organizer" && result.user.role !== "admin") {
        setError("Organizer account required");
        return;
      }
      setToken(result.token);
      setStoredUser(result.user);
      setLoggedIn(true);
      const list = await api.listOrganizerEvents();
      setEvents(list.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("hirnao_token");
    if (token) {
      api.listOrganizerEvents()
        .then((r) => { setEvents(r.events); setLoggedIn(true); })
        .catch(() => {});
    }
  }, []);

  if (loggedIn) {
    return (
      <div className="container page-content">
        <header className="header">
          <span className="logo">HIRNAO</span>
          <span className="tag">{t(locale, "organizerSpace")}</span>
        </header>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>{t(locale, "dashboard")}</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((event) => (
            <Link key={event.id} href={`/organizer/events/${event.id}`} className="card" style={{ display: "block" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{event.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {event.venue_name} · {event.status}
              </p>
            </Link>
          ))}
          {events.length === 0 && (
            <Link href={`/organizer/events/${DEMO_EVENT_ID}`} className="btn btn-primary">
              AI Summit Paris 2026 (démo)
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/" className="logo">HIRNAO</Link>
      </header>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t(locale, "organizerLogin")}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{t(locale, "demoOrganizerHint")}</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="label">{t(locale, "yourEmail")}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t(locale, "loading") : t(locale, "continue")}
        </button>
      </form>
    </div>
  );
}
