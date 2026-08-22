"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/plans", label: "Plans", icon: CalendarDays },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-stone-900"
                  : "text-stone-400 hover:text-stone-600",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "stroke-[2.5]")}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
