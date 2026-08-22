"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wine, Coffee, Palette, Dumbbell, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/shared";
import { useApp } from "@/lib/store";
import Link from "next/link";
import { formatDateFr } from "@/lib/utils";

const quickActions = [
  { icon: Wine, label: "Apéro", activity: "Apéro entre amis" },
  { icon: Coffee, label: "Brunch", activity: "Brunch" },
  { icon: Palette, label: "Expo", activity: "Exposition" },
  { icon: Dumbbell, label: "Sport", activity: "Activité sportive" },
];

export default function HomePage() {
  const router = useRouter();
  const { plans, user } = useApp();
  const [prompt, setPrompt] = useState("");

  const activePlans = plans.filter(
    (p) => !["confirmed", "cancelled", "expired"].includes(p.status),
  );

  useEffect(() => {
    if (!user.onboarding_completed) {
      router.push("/onboarding");
    }
  }, [user.onboarding_completed, router]);

  const handlePrompt = () => {
    if (!prompt.trim()) return;
    router.push(`/plans/new?activity=${encodeURIComponent(prompt)}`);
  };

  const handleQuickAction = (activity: string) => {
    router.push(`/plans/new?activity=${encodeURIComponent(activity)}`);
  };

  if (!user.onboarding_completed) return null;

  return (
    <div className="px-5 pt-8">
      <PageHeader title="Qu'aimeriez-vous organiser ?" />

      <div className="relative">
        <Textarea
          placeholder="Ex : un apéro au canal samedi soir avec les copains..."
          className="min-h-[100px] resize-none pr-14 text-base"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePrompt();
            }
          }}
        />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full"
          onClick={handlePrompt}
          disabled={!prompt.trim()}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-stone-400">
          Actions rapides
        </p>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, activity }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(activity)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 p-3 transition-colors hover:bg-[#E8DFD3]/50 active:scale-95"
            >
              <Icon className="h-5 w-5 text-stone-700" />
              <span className="text-xs font-medium text-stone-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activePlans.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Plans en cours
            </p>
            <Link href="/plans" className="text-xs font-medium text-stone-500 hover:text-stone-700">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {activePlans.slice(0, 3).map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-stone-900">{plan.title}</p>
                      <p className="text-sm text-stone-500">
                        {plan.location_area} · {formatDateFr(plan.date_start)}
                      </p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href="/plans/new">
        <Button variant="accent" className="mt-8 w-full" size="lg">
          <Plus className="h-4 w-4" />
          Créer un plan
        </Button>
      </Link>
    </div>
  );
}
