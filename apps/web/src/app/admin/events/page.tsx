"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type AdminEventData } from "@/lib/api";
import { AdminNav } from "@/components/AdminNav";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEventData[]>([]);

  useEffect(() => {
    api.getAdminEvents().then((r) => setEvents(r.events)).catch(console.error);
  }, []);

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/admin/dashboard" className="logo">HIRNAO Admin</Link>
      </header>
      <AdminNav />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Events</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((e) => (
          <div key={e.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong>{e.title}</strong>
              <span className="tag">{e.status}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {(e as AdminEventData).organizer_name} · {(e as AdminEventData).participant_count ?? 0} participants
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
