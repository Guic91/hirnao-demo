"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type CardData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { EventNav } from "@/components/EventNav";

function TagSection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="label">{label}</p>
      <div className="tag-list">
        {items.map((item) => (
          <span key={item} className="tag">{item}</span>
        ))}
      </div>
    </div>
  );
}

export default function CardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useApp();
  const [card, setCard] = useState<CardData | null>(null);
  const [eventId, setEventId] = useState<string>();

  useEffect(() => {
    api.getEvent(slug).then((r) => {
      setEventId(r.event.id);
      return api.getMyCard(r.event.id);
    }).then((r) => setCard(r.card)).catch(console.error);
  }, [slug]);

  if (!card) return <div className="container page-content"><p style={{ paddingTop: 40 }}>{t(locale, "loading")}</p></div>;

  return (
    <div className="container page-content">
      <header className="header">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t(locale, "myCard")}</h1>
      </header>

      <div className="card" style={{ marginBottom: 24 }}>
        {card.headline && <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{card.headline}</h2>}
        {card.activity && <p style={{ color: "var(--warm)", fontWeight: 600, marginBottom: 12 }}>{card.activity}</p>}
        {card.bio && <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>{card.bio}</p>}

        <div style={{ marginBottom: 16 }}>
          <p className="label">Complétude</p>
          <div style={{ background: "var(--accent-soft)", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div style={{ background: "var(--accent)", height: "100%", width: `${card.completeness_score * 100}%`, borderRadius: 8 }} />
          </div>
        </div>

        <TagSection label={t(locale, "intentions")} items={card.intentions} />
        <TagSection label={t(locale, "seeking")} items={card.seeking} />
        <TagSection label={t(locale, "offering")} items={card.offering} />
        <TagSection label={t(locale, "interests")} items={card.interests} />
        <TagSection label={t(locale, "expertises")} items={card.expertises} />
      </div>

      <Link href={`/e/${slug}/discover`} className="btn btn-primary">
        {t(locale, "goToDiscover")}
      </Link>

      {eventId && <EventNav slug={slug} active="card" />}
    </div>
  );
}
