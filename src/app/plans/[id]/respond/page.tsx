"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { generateTimeSlots } from "@/lib/slot-ranking";
import { formatDateFr, formatTimeFr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/types";

type SlotSelection = {
  slot_date: string;
  slot_time: string;
  status: AvailabilityStatus;
};

export default function RespondPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { plans, getPlanInvitees, submitAvailability } = useApp();

  const plan = plans.find((p) => p.id === id);
  const invitees = getPlanInvitees(id);
  const currentInvitee = invitees[0]; // Demo: respond as first invitee

  const [mode, setMode] = useState<"slots" | "unavailable" | "alternative">("slots");
  const [selections, setSelections] = useState<SlotSelection[]>([]);
  const [alternativeNote, setAlternativeNote] = useState("");

  if (!plan || !currentInvitee) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-stone-400">Plan introuvable</p>
      </div>
    );
  }

  const slots = generateTimeSlots(
    plan.date_start,
    plan.date_end,
    plan.time_window_start,
    plan.time_window_end,
    plan.duration_minutes,
  );

  const toggleSlot = (slot_date: string, slot_time: string) => {
    const existing = selections.find(
      (s) => s.slot_date === slot_date && s.slot_time === slot_time,
    );

    if (!existing) {
      setSelections([...selections, { slot_date, slot_time, status: "available" }]);
    } else if (existing.status === "available") {
      setSelections(
        selections.map((s) =>
          s.slot_date === slot_date && s.slot_time === slot_time
            ? { ...s, status: "tentative" as AvailabilityStatus }
            : s,
        ),
      );
    } else {
      setSelections(
        selections.filter(
          (s) => !(s.slot_date === slot_date && s.slot_time === slot_time),
        ),
      );
    }
  };

  const getSlotStatus = (slot_date: string, slot_time: string): AvailabilityStatus | null => {
    const s = selections.find(
      (sel) => sel.slot_date === slot_date && sel.slot_time === slot_time,
    );
    return s?.status ?? null;
  };

  const handleSubmit = () => {
    if (mode === "unavailable") {
      submitAvailability(id, currentInvitee.id, [], true);
    } else if (mode === "alternative") {
      submitAvailability(id, currentInvitee.id, [], false, alternativeNote);
    } else {
      submitAvailability(
        id,
        currentInvitee.id,
        selections.map((s) => ({
          ...s,
          travel_minutes: Math.floor(Math.random() * 20) + 5,
        })),
      );
    }
    router.push(`/plans/${id}`);
  };

  const groupedSlots = slots.reduce(
    (acc, slot) => {
      if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
      acc[slot.slot_date].push(slot);
      return acc;
    },
    {} as Record<string, typeof slots>,
  );

  return (
    <div className="px-5 pt-6 pb-8">
      <Link
        href={`/plans/${id}`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au plan
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Vos disponibilités</h1>
      <p className="mt-1 text-sm text-stone-500">
        {plan.title} · {plan.location_area}
      </p>

      <div className="mt-6 flex gap-2">
        {(["slots", "unavailable", "alternative"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600",
            )}
          >
            {m === "slots" ? "Créneaux" : m === "unavailable" ? "Indisponible" : "Alternative"}
          </button>
        ))}
      </div>

      {mode === "slots" && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-stone-500">
            Appuyez une fois pour confirmer, deux fois pour « peut-être »
          </p>
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date}>
              <p className="mb-2 text-sm font-medium text-stone-700">
                {formatDateFr(date)}
              </p>
              <div className="flex flex-wrap gap-2">
                {dateSlots.map((slot) => {
                  const status = getSlotStatus(slot.slot_date, slot.slot_time);
                  return (
                    <button
                      key={`${slot.slot_date}-${slot.slot_time}`}
                      onClick={() => toggleSlot(slot.slot_date, slot.slot_time)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        status === "available"
                          ? "bg-stone-900 text-white"
                          : status === "tentative"
                            ? "bg-[#E8DFD3] text-stone-900"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                      )}
                    >
                      {formatTimeFr(slot.slot_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "unavailable" && (
        <div className="mt-6 rounded-2xl bg-stone-50 p-6 text-center">
          <p className="text-stone-600">
            Vous n&apos;êtes pas disponible pour cette sortie ?
          </p>
          <p className="mt-2 text-sm text-stone-400">
            L&apos;organisateur sera notifié de votre indisponibilité.
          </p>
        </div>
      )}

      {mode === "alternative" && (
        <div className="mt-6">
          <Label htmlFor="alt">Proposez une alternative</Label>
          <Textarea
            id="alt"
            className="mt-2"
            placeholder="Ex : plutôt dimanche midi au Marais..."
            value={alternativeNote}
            onChange={(e) => setAlternativeNote(e.target.value)}
          />
        </div>
      )}

      <Button
        className="mt-8 w-full"
        size="lg"
        disabled={
          (mode === "slots" && selections.length === 0) ||
          (mode === "alternative" && !alternativeNote.trim())
        }
        onClick={handleSubmit}
      >
        Envoyer ma réponse
      </Button>
    </div>
  );
}
