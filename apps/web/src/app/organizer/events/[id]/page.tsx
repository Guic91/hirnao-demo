"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, type EventKPIs } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

const KPI_KEYS: (keyof EventKPIs)[] = [
  "participants",
  "activation_rate",
  "recommendations_generated",
  "recommendations_opened",
  "connections_sent",
  "acceptance_rate",
  "meeting_rate",
  "relevance_positive_rate",
  "return_rate",
];

const KPI_LABELS: Record<string, { fr: string; en: string }> = {
  participants: { fr: "Participants", en: "Participants" },
  activation_rate: { fr: "Activation", en: "Activation" },
  recommendations_generated: { fr: "Recommandations", en: "Recommendations" },
  recommendations_opened: { fr: "Consultées", en: "Opened" },
  connections_sent: { fr: "Connexions", en: "Connections" },
  acceptance_rate: { fr: "Acceptation", en: "Acceptance" },
  meeting_rate: { fr: "Rencontres", en: "Meetings" },
  relevance_positive_rate: { fr: "Pertinence +", en: "Relevance +" },
  return_rate: { fr: "Retour", en: "Return" },
};

function formatKpi(key: keyof EventKPIs, value: number): string {
  if (key === "participants" || key === "recommendations_generated" || key === "recommendations_opened" || key === "connections_sent") {
    return String(value);
  }
  return `${Math.round(value * 100)}%`;
}

export default function OrganizerEventPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useApp();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [kpis, setKpis] = useState<EventKPIs | null>(null);
  const [accessUrl, setAccessUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, qrRes] = await Promise.all([
        api.getEventKpis(id),
        api.getEventQr(id),
      ]);
      setTitle(kpiRes.event.title);
      setStatus(kpiRes.event.status);
      setKpis(kpiRes.kpis);
      setAccessUrl(qrRes.access.access_url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function copyLink() {
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !kpis) {
    return <div className="container page-content"><p style={{ paddingTop: 40 }}>{t(locale, "loading")}</p></div>;
  }

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/organizer" style={{ fontSize: 14, color: "var(--text-muted)" }}>← {t(locale, "organizerSpace")}</Link>
      </header>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{title}</h1>
        <span className="tag">{status}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p className="label">{t(locale, "accessLink")}</p>
        <p style={{ fontSize: 13, wordBreak: "break-all", marginBottom: 12 }}>{accessUrl}</p>
        <button className="btn btn-secondary btn-sm" onClick={copyLink}>
          {copied ? t(locale, "copied") : t(locale, "copyLink")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {KPI_KEYS.map((key) => (
          <div key={key} className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              {KPI_LABELS[key]?.[locale] ?? key}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800 }}>{formatKpi(key, kpis[key])}</p>
          </div>
        ))}
      </div>

      <Link href={`/organizer/events/${id}/participants`} className="btn btn-primary">
        {t(locale, "participants")} ({kpis.participants})
      </Link>
    </div>
  );
}
