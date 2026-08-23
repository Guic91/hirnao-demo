"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminNav } from "@/components/AdminNav";

export default function AdminAiUsagePage() {
  const [data, setData] = useState<{ mode: string; total_calls: number; recent: { operation: string; model: string; input_tokens: number; output_tokens: number; created_at: string }[] } | null>(null);

  useEffect(() => {
    api.getAdminAiUsage().then(setData).catch(console.error);
  }, []);

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/admin/dashboard" className="logo">HIRNAO Admin</Link>
      </header>
      <AdminNav />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>AI Usage</h1>

      {data && (
        <>
          <div className="card" style={{ marginBottom: 16, padding: 16 }}>
            <p>Mode: <strong>{data.mode}</strong></p>
            <p>Total calls: <strong>{data.total_calls}</strong></p>
          </div>

          {data.recent.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.recent.map((log, i) => (
                <div key={i} className="card" style={{ padding: 12, fontSize: 13 }}>
                  <strong>{log.operation}</strong> · {log.model} · {log.input_tokens}+{log.output_tokens} tokens
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Aucun appel IA enregistré (mode rule-based actif)</p>
          )}
        </>
      )}
    </div>
  );
}
