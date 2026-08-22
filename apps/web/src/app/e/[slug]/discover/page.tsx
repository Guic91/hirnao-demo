"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, type RecommendationData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { EventNav } from "@/components/EventNav";

export default function DiscoverPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useApp();
  const [eventId, setEventId] = useState<string>();
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (eid: string) => {
    setLoading(true);
    try {
      const res = await api.getRecommendations(eid);
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getEvent(slug).then((r) => {
      setEventId(r.event.id);
      return load(r.event.id);
    });
  }, [slug, load]);

  async function toggleVisibility() {
    const next = !visible;
    setVisible(next);
    await api.setVisibility(slug, next);
    if (eventId) await load(eventId);
  }

  async function handleAction(rec: RecommendationData, action: "connect" | "later" | "dismiss") {
    await api.recommendationAction(rec.id, action);
    if (action === "connect") {
      await api.sendConnection(rec.candidate_id, eventId!, rec.id, rec.suggested_opener);
    }
    if (eventId) await load(eventId);
  }

  return (
    <div className="container page-content">
      <header className="header">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t(locale, "recommendations")}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {visible ? t(locale, "visible") : t(locale, "hidden")}
          </span>
          <button className={`toggle ${visible ? "on" : ""}`} onClick={toggleVisibility} aria-label={t(locale, "visibility")} />
        </div>
      </header>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>{t(locale, "loading")}</p>
      ) : recommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>{t(locale, "noRecommendations")}</p>
          <button className="btn btn-secondary" onClick={() => eventId && load(eventId)}>
            {t(locale, "refresh")}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {recommendations.map((rec) => (
            <div key={rec.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{rec.candidate.display_name}</h3>
                  {rec.candidate.headline && (
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{rec.candidate.headline}</p>
                  )}
                </div>
                <span className="score-badge">{rec.compatibility_pct}%</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <p className="label">{t(locale, "whyMatch")}</p>
                <ul style={{ paddingLeft: 16, fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>
                  {rec.explanation.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {rec.explanation.common_interests.length > 0 && (
                <div className="tag-list" style={{ marginBottom: 12 }}>
                  {rec.explanation.common_interests.map((i) => (
                    <span key={i} className="tag">{i}</span>
                  ))}
                </div>
              )}

              {rec.suggested_opener && (
                <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-muted)", marginBottom: 16, padding: "10px 12px", background: "var(--warm-light)", borderRadius: 8 }}>
                  &ldquo;{rec.suggested_opener}&rdquo;
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAction(rec, "connect")}>
                  {t(locale, "connect")}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleAction(rec, "later")}>
                  {t(locale, "later")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EventNav slug={slug} active="discover" />
    </div>
  );
}
