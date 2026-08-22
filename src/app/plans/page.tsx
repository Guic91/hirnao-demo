"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/shared";
import { useApp } from "@/lib/store";
import { formatDateFr } from "@/lib/utils";

export default function PlansPage() {
  const { plans } = useApp();

  const sorted = [...plans].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div className="px-5 pt-8">
      <PageHeader title="Mes plans" subtitle={`${plans.length} plan${plans.length > 1 ? "s" : ""}`} />

      <div className="space-y-3">
        {sorted.map((plan) => (
          <Link key={plan.id} href={`/plans/${plan.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-stone-900">{plan.title}</p>
                    <p className="mt-0.5 text-sm text-stone-500">{plan.activity}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {plan.location_area} · {formatDateFr(plan.date_start)}
                      {plan.date_end !== plan.date_start &&
                        ` — ${formatDateFr(plan.date_end)}`}
                    </p>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-stone-400">Aucun plan pour le moment</p>
          <p className="mt-1 text-sm text-stone-400">
            Créez votre premier plan pour commencer
          </p>
        </div>
      )}

      <Link href="/plans/new">
        <Button className="mt-8 w-full" size="lg">
          <Plus className="h-4 w-4" />
          Nouveau plan
        </Button>
      </Link>
    </div>
  );
}
