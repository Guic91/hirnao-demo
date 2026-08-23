"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type OrganizerParticipant } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function OrganizerParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useApp();
  const [participants, setParticipants] = useState<OrganizerParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrganizerParticipants(id)
      .then((r) => setParticipants(r.participants))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="container page-content">
      <header className="header">
        <Link href={`/organizer/events/${id}`} style={{ fontSize: 14, color: "var(--text-muted)" }}>
          ← {t(locale, "dashboard")}
        </Link>
      </header>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{t(locale, "participants")}</h1>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>{t(locale, "loading")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {participants.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{p.display_name}</h3>
                  {p.headline && <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{p.headline}</p>}
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{p.email}</p>
                </div>
                <span className="tag">{p.status}</span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
                <span>{t(locale, "completeness")}: {Math.round(p.completeness_score * 100)}%</span>
                <span>Reco: {p.recommendations_count}</span>
                <span>{t(locale, "connections")}: {p.connections_count}</span>
                {p.visible_in_event && <span className="tag">{t(locale, "visible")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
