"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, setStoredUser, setToken } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { locale, setLocale, setUser } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = isLogin
        ? await api.login(email)
        : await api.register({ email, display_name: name, locale });

      setToken(result.token);
      setStoredUser(result.user);
      setUser(result.user);

      await api.joinEvent(slug);
      await api.checkin(slug);

      router.push(`/e/${slug}/agent`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page-content">
      <header className="header">
        <span className="logo">HIRNAO</span>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as "fr" | "en")}
          style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", background: "white" }}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </header>

      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          {isLogin ? t(locale, "loginExisting") : t(locale, "createAccount")}
        </h1>
        <p style={{ color: "var(--text-muted)" }}>{t(locale, "tagline")}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!isLogin && (
          <div>
            <label className="label">{t(locale, "yourName")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="label">{t(locale, "yourEmail")}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t(locale, "loading") : t(locale, "continue")}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginTop: 16 }}
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? t(locale, "createAccount") : t(locale, "loginExisting")}
      </button>
    </div>
  );
}
