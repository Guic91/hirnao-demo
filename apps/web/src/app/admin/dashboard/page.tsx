"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type AdminStats } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { AdminNav } from "@/components/AdminNav";

const STAT_KEYS: (keyof AdminStats)[] = [
  "users", "events", "participants", "recommendations", "connections", "reports_open", "ai_calls",
];

const LABELS: Record<string, { fr: string; en: string }> = {
  users: { fr: "Utilisateurs", en: "Users" },
  events: { fr: "Événements", en: "Events" },
  participants: { fr: "Participants", en: "Participants" },
  recommendations: { fr: "Recommandations", en: "Recommendations" },
  connections: { fr: "Connexions", en: "Connections" },
  reports_open: { fr: "Signalements ouverts", en: "Open reports" },
  ai_calls: { fr: "Appels IA", en: "AI calls" },
};

export default function AdminDashboardPage() {
  const { locale } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.getAdminStats().then((r) => setStats(r.stats)).catch(console.error);
  }, []);

  if (!stats) return <div className="container page-content"><p>{t(locale, "loading")}</p></div>;

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/" className="logo">HIRNAO</Link>
        <span className="tag" style={{ background: "var(--accent)", color: "white" }}>Admin</span>
      </header>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t(locale, "dashboard")}</h1>
      <AdminNav />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {STAT_KEYS.map((key) => (
          <div key={key} className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
              {LABELS[key]?.[locale] ?? key}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800 }}>{stats[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
