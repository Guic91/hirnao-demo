"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

const NAV = [
  { href: "/admin/dashboard", key: "dashboard" as const },
  { href: "/admin/users", key: "users" as const },
  { href: "/admin/events", key: "events" as const },
  { href: "/admin/reports", key: "reports" as const },
  { href: "/admin/ai-usage", key: "aiUsage" as const },
];

export function AdminNav() {
  const pathname = usePathname();
  const { locale } = useApp();

  const labels: Record<string, string> = {
    dashboard: t(locale, "dashboard"),
    users: "Users",
    events: "Events",
    reports: "Reports",
    aiUsage: "AI Usage",
  };

  return (
    <nav style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 8 }}>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="tag"
          style={{
            background: pathname === item.href ? "var(--accent)" : "var(--warm-light)",
            color: pathname === item.href ? "white" : "var(--text)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {labels[item.key]}
        </Link>
      ))}
    </nav>
  );
}
