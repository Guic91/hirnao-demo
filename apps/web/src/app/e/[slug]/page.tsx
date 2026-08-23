"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type EventData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useApp();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvent(slug).then((r) => setEvent(r.event)).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="container page-content"><p style={{ paddingTop: 40 }}>{t(locale, "loading")}</p></div>;
  if (!event) return <div className="container page-content"><p style={{ paddingTop: 40 }}>{t(locale, "eventNotFound")}</p></div>;

  const startDate = new Date(event.starts_at);

  return (
    <div className="container page-content">
      <header className="header">
        <span className="logo">HIRNAO</span>
      </header>

      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <p className="label">{t(locale, "welcome")}</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>{event.title}</h1>
        {event.description && (
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6 }}>{event.description}</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        {event.venue_name && (
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{event.venue_name}</p>
        )}
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {t(locale, "eventStarts")} {startDate.toLocaleDateString(locale)} {t(locale, "at")}{" "}
          {startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <Link href={`/e/${slug}/join`} className="btn btn-primary">
        {t(locale, "joinEvent")}
      </Link>
    </div>
  );
}
