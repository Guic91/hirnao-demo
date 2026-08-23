"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type UserData } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { AdminNav } from "@/components/AdminNav";

export default function AdminUsersPage() {
  const { locale } = useApp();
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.getAdminUsers().then((r) => { setUsers(r.users); setTotal(r.total); }).catch(console.error);
  }, []);

  return (
    <div className="container page-content">
      <header className="header">
        <Link href="/admin/dashboard" className="logo">HIRNAO Admin</Link>
      </header>
      <AdminNav />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Users ({total})</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{u.display_name}</strong>
              <span className="tag">{u.role}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
