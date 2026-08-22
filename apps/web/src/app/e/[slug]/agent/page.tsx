"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, type AgentResponse } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function AgentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { locale } = useApp();
  const [eventId, setEventId] = useState<string>();
  const [exchanges, setExchanges] = useState<AgentResponse["exchanges"]>([]);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getEvent(slug).then(async (r) => {
      setEventId(r.event.id);
      const status = await api.getOnboardingStatus(r.event.id);
      if (status.has_card) {
        router.replace(`/e/${slug}/discover`);
        return;
      }
      if (exchanges.length === 0) {
        const opening =
          locale === "fr"
            ? "Bonjour ! Je suis votre agent Hirnao. Je vais vous aider à créer votre Card ID pour cet événement. Commençons par vos intentions."
            : "Hello! I'm your Hirnao agent. I'll help you create your Card ID for this event. Let's start with your intentions.";
        setExchanges([{ role: "agent", content: opening, timestamp: new Date().toISOString() }]);
      }
    });
  }, [slug, locale, router, exchanges.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.sendAgentMessage(message.trim(), eventId);
      setExchanges(res.exchanges);
      setComplete(res.complete);
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await api.finalizeOnboarding(eventId);
      router.push(`/e/${slug}/card`);
    } catch (err) {
      console.error(err);
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: complete ? 140 : 80 }}>
      <header className="header">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>{t(locale, "agentTitle")}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t(locale, "agentSubtitle")}</p>
        </div>
      </header>

      <div className="chat-messages">
        {exchanges.map((ex, i) => (
          <div key={i} className={`chat-bubble ${ex.role}`}>
            {ex.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {complete ? (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-primary" onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? t(locale, "loading") : t(locale, "finalizeCard")}
          </button>
        </div>
      ) : (
        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(locale, "typeMessage")}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "14px 20px" }} disabled={loading}>
            {t(locale, "send")}
          </button>
        </form>
      )}
    </div>
  );
}
