"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

interface EventNavProps {
  slug: string;
  active: "discover" | "card" | "connections";
}

export function EventNav({ slug, active }: EventNavProps) {
  const { locale } = useApp();

  const items = [
    { key: "discover" as const, href: `/e/${slug}/discover`, label: t(locale, "discover") },
    { key: "card" as const, href: `/e/${slug}/card`, label: t(locale, "myCard") },
    { key: "connections" as const, href: `/e/${slug}/connections`, label: t(locale, "connections") },
  ];

  return (
    <nav className="nav-bottom">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`nav-item ${active === item.key ? "active" : ""}`}
        >
          <span style={{ fontSize: 18 }}>
            {item.key === "discover" ? "✦" : item.key === "card" ? "◫" : "◎"}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
