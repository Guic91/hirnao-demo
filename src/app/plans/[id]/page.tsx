"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Users, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, Avatar } from "@/components/shared";
import { useApp } from "@/lib/store";
import { rankSlots } from "@/lib/slot-ranking";
import { formatDateFr, formatTimeFr, formatDateTimeFr } from "@/lib/utils";
import { cn } from "@/lib/utils";

const INVITEE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  invited: "Invité",
  responded: "A répondu",
  confirmed: "Confirmé",
  declined: "Décliné",
};

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    plans,
    getPlanInvitees,
    getPlanAvailability,
    getPlanProposals,
    getPlanMessages,
    generateProposals,
    addMessage,
    refresh,
  } = useApp();

  const plan = plans.find((p) => p.id === id);
  const invitees = getPlanInvitees(id);
  const availability = getPlanAvailability(id);
  const proposals = getPlanProposals(id);
  const messages = getPlanMessages(id);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!plan) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-stone-400">Plan introuvable</p>
        <Link href="/plans">
          <Button variant="ghost" className="mt-4">Retour aux plans</Button>
        </Link>
      </div>
    );
  }

  useEffect(() => {
    if (plan?.status === "confirmed") {
      router.replace(`/plans/${id}/confirmed`);
    }
  }, [plan?.status, id, router]);

  if (plan.status === "confirmed") {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-sm text-stone-500">Redirection...</p>
      </div>
    );
  }

  const ranked = rankSlots(availability);
  const respondedCount = invitees.filter(
    (i) => i.status === "responded" || i.status === "confirmed",
  ).length;

  const handleGenerateProposals = () => {
    generateProposals(id);
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
        <ArrowLeft className="h-4 w-4" />
        Plans
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{plan.title}</h1>
            <p className="mt-1 text-sm text-stone-500">{plan.activity}</p>
          </div>
          <StatusBadge status={plan.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {plan.location_area}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDateFr(plan.date_start)}
            {plan.date_end !== plan.date_start && ` — ${formatDateFr(plan.date_end)}`}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> min. {plan.min_participants}
          </span>
        </div>
      </div>

      {/* Invitees */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Invités</span>
            <span className="text-sm font-normal text-stone-400">
              {respondedCount}/{invitees.length} réponses
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invitees.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={inv.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-stone-900">{inv.name}</p>
                  <p className="text-xs text-stone-400">{inv.neighborhood}</p>
                </div>
              </div>
              <Badge
                variant={
                  inv.status === "responded" || inv.status === "confirmed"
                    ? "success"
                    : inv.status === "declined"
                      ? "destructive"
                      : "default"
                }
              >
                {INVITEE_STATUS_LABELS[inv.status]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Availability responses */}
      {availability.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Disponibilités reçues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-500">
              {availability.filter((a) => a.status === "available").length} créneaux confirmés,{" "}
              {availability.filter((a) => a.status === "tentative").length} tentatifs
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ranked slots */}
      {(plan.status === "proposing" || plan.status === "collecting_availability") &&
        ranked.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Créneaux suggérés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranked.slice(0, 5).map((slot, i) => (
                <div
                  key={`${slot.slot_date}-${slot.slot_time}`}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3",
                    i === 0 ? "border-[#E8DFD3] bg-[#E8DFD3]/20" : "border-stone-100",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {formatDateTimeFr(slot.slot_date, slot.slot_time)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {slot.confirmed_count} confirmé{slot.confirmed_count > 1 ? "s" : ""}
                      {slot.tentative_count > 0 &&
                        ` · ${slot.tentative_count} tentatif${slot.tentative_count > 1 ? "s" : ""}`}
                      {slot.average_travel_minutes > 0 &&
                        ` · ~${Math.round(slot.average_travel_minutes)} min trajet`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-900">{Math.round(slot.score)}</p>
                    <p className="text-[10px] text-stone-400">score</p>
                  </div>
                </div>
              ))}

              {plan.status === "proposing" && proposals.length === 0 && (
                <Button className="w-full mt-2" onClick={handleGenerateProposals}>
                  Envoyer les propositions
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      {/* Proposals awaiting confirmation */}
      {proposals.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Propositions envoyées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.map((prop) => (
              <Link key={prop.id} href={`/plans/${id}/confirm/${prop.id}`}>
                <div className="flex items-center justify-between rounded-xl border border-stone-100 p-3 hover:border-stone-300 transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      #{prop.rank} — {formatDateTimeFr(prop.slot_date, prop.slot_time)}
                    </p>
                    <p className="text-xs text-stone-400">
                      Score {Math.round(prop.score)} · {prop.confirmed_count} confirmés
                    </p>
                  </div>
                  <Badge variant="accent">Confirmer</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs font-medium text-stone-600">{msg.sender_name}</p>
                <p className="mt-0.5 text-sm text-stone-800">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {plan.status === "collecting_availability" && (
          <Link href={`/plans/${id}/respond`}>
            <Button variant="accent" className="w-full">
              Répondre aux disponibilités
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
