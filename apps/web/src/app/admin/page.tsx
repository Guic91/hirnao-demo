"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, setStoredUser, setToken } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { locale } = useApp();
  const [email, setEmail] = useState("admin@hirnao.app");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hirnao_token");
    if (token) {
      api.getAdminStats().then(() => router.replace("/admin/dashboard")).catch(() => {});
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.adminLogin(email);
      if (result.user.role !== "admin") {
        setError("Admin account required");
        return;
      }
      setToken(result.token);
      setStoredUser(result.user);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/" className="logo">HIRNAO</Link>
        <span className="tag" style={{ background: "var(--accent)", color: "white" }}>Admin</span>
      </header>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Back-office Admin</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Démo : admin@hirnao.app</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="label">{t(locale, "yourEmail")}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t(locale, "loading") : t(locale, "continue")}
        </button>
      </form>
    </div>
  );
}
