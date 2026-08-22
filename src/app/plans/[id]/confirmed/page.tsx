"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, Avatar } from "@/components/shared";
import { useApp } from "@/lib/store";
import { formatDateFr, formatTimeFr } from "@/lib/utils";
import { downloadICS } from "@/lib/ics";

export default function ConfirmedPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { plans, getPlanInvitees } = useApp();

  const plan = plans.find((p) => p.id === id);
  const invitees = getPlanInvitees(id);

  if (!plan) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-stone-400">Plan introuvable</p>
      </div>
    );
  }

  const confirmedSlot = plan.confirmed_slot
    ? new Date(plan.confirmed_slot)
    : null;

  const handleDownloadICS = () => {
    downloadICS({
      id: plan.id,
      title: plan.title,
      activity: plan.activity,
      description: plan.description,
      date_start: plan.date_start,
      time_window_start: plan.time_window_start,
      duration_minutes: plan.duration_minutes,
      location_area: plan.location_area,
      confirmed_slot: plan.confirmed_slot,
      confirmed_venue: plan.confirmed_venue,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: plan.title,
        text: `${plan.title} — ${plan.location_area}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Plans
      </Link>

      <div className="mt-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">{plan.title}</h1>
        <div className="mt-2 flex justify-center">
          <StatusBadge status="confirmed" />
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-5">
          {confirmedSlot && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {formatDateFr(confirmedSlot.toISOString())}
                </p>
                <p className="text-sm text-stone-500">
                  {formatTimeFr(
                    `${String(confirmedSlot.getHours()).padStart(2, "0")}:${String(confirmedSlot.getMinutes()).padStart(2, "0")}`,
                  )}{" "}
                  · {plan.duration_minutes} min
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-stone-400" />
            <div>
              <p className="text-sm font-medium text-stone-900">
                {plan.confirmed_venue ?? plan.location_area}
              </p>
              <p className="text-sm text-stone-500">{plan.location_area}, Paris</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-stone-700">Participants</p>
          <div className="space-y-3">
            {invitees
              .filter((inv) => inv.status !== "declined")
              .map((inv) => (
                <div key={inv.id} className="flex items-center gap-3">
                  <Avatar name={inv.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">{inv.name}</p>
                    <p className="text-xs text-stone-400">{inv.neighborhood}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <Button className="w-full" size="lg" onClick={handleDownloadICS}>
          <Download className="h-4 w-4" />
          Ajouter au calendrier (.ics)
        </Button>
        <Button variant="outline" className="w-full" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>
    </div>
  );
}
