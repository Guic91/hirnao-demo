"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type ConnectionData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { EventNav } from "@/components/EventNav";

export default function ConnectionsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, user } = useApp();
  const [connections, setConnections] = useState<ConnectionData[]>([]);

  useEffect(() => {
    api.getEvent(slug).then((r) => api.getConnections(r.event.id)).then((r) => setConnections(r.connections)).catch(console.error);
  }, [slug]);

  return (
    <div className="container page-content">
      <header className="header">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t(locale, "connections")}</h1>
      </header>

      {connections.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
          {t(locale, "noRecommendations")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {connections.map((c) => {
            const otherName = c.requester_id === user?.id ? c.recipient_name : c.requester_name;
            return (
              <div key={c.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontWeight: 700 }}>{otherName}</h3>
                  <span className="tag">
                    {c.status === "accepted" ? t(locale, "accepted") : t(locale, "pending")}
                  </span>
                </div>
                {c.message && (
                  <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
                    &ldquo;{c.message}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EventNav slug={slug} active="connections" />
    </div>
  );
}
