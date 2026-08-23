"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type AdminReport } from "@/lib/api";
import { AdminNav } from "@/components/AdminNav";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);

  const load = useCallback(() => {
    api.getAdminReports().then((r) => setReports(r.reports)).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resolve(id: string) {
    await api.updateAdminReport(id, "resolved");
    load();
  }

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/admin/dashboard" className="logo">HIRNAO Admin</Link>
      </header>
      <AdminNav />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Reports</h1>
      {reports.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Aucun signalement</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reports.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>{r.reporter_name} → {r.reported_name}</strong>
                <span className="tag">{r.status}</span>
              </div>
              <p style={{ fontSize: 14, marginBottom: 12 }}>{r.reason}</p>
              {r.status === "open" && (
                <button className="btn btn-secondary btn-sm" onClick={() => resolve(r.id)}>
                  Résoudre
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
