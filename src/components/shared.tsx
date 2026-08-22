"use client";

import { useApp } from "@/lib/store";
import { PLAN_STATUS_LABELS, PLAN_STATUS_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PLAN_STATUS_COLORS[status],
      )}
    >
      {PLAN_STATUS_LABELS[status]}
    </span>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#E8DFD3] font-medium text-stone-800",
        sizeClasses[size],
      )}
    >
      {initials}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { user } = useApp();
  return (
    <header className="mb-6">
      <p className="text-sm text-stone-500">Bonjour, {user.full_name.split(" ")[0]}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
    </header>
  );
}
