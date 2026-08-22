"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/shared";
import { cn } from "@/lib/utils";

const AREAS = [
  "Marais", "Bastille", "Canal Saint-Martin", "Montmartre",
  "République", "Oberkampf", "Saint-Germain", "Belleville",
];

function CreatePlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { contacts, createPlan, addInvitees } = useApp();

  const [title, setTitle] = useState("");
  const [activity, setActivity] = useState(searchParams.get("activity") ?? "");
  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("22:00");
  const [duration, setDuration] = useState(120);
  const [locationArea, setLocationArea] = useState("");
  const [venuePref, setVenuePref] = useState("");
  const [minParticipants, setMinParticipants] = useState(2);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    const act = searchParams.get("activity");
    if (act) {
      setActivity(act);
      if (!title) setTitle(act);
    }
  }, [searchParams, title]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSubmit = () => {
    if (!title || !activity || !dateStart || !locationArea) return;

    const planId = createPlan({
      title,
      activity,
      description,
      date_start: dateStart,
      date_end: dateEnd || dateStart,
      time_window_start: timeStart,
      time_window_end: timeEnd,
      duration_minutes: duration,
      location_area: locationArea,
      venue_preference: venuePref || undefined,
      min_participants: minParticipants,
    });

    if (selectedContacts.length > 0) {
      addInvitees(planId, selectedContacts);
    }

    router.push(`/plans/${planId}`);
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <h1 className="text-2xl font-semibold text-stone-900">Nouveau plan</h1>
      <p className="mt-1 text-sm text-stone-500">Décrivez votre sortie et invitez vos contacts</p>

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" className="mt-1.5" placeholder="Apéro au Canal" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="activity">Activité</Label>
          <Input id="activity" className="mt-1.5" placeholder="Apéro entre amis" value={activity} onChange={(e) => setActivity(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="description">Description (optionnel)</Label>
          <Textarea id="description" className="mt-1.5" placeholder="Quelques détails..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dateStart">Date début</Label>
            <Input id="dateStart" type="date" className="mt-1.5" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateEnd">Date fin</Label>
            <Input id="dateEnd" type="date" className="mt-1.5" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="timeStart">De</Label>
            <Input id="timeStart" type="time" className="mt-1.5" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="timeEnd">À</Label>
            <Input id="timeEnd" type="time" className="mt-1.5" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="duration">Durée (minutes)</Label>
          <Input id="duration" type="number" className="mt-1.5" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={30} step={30} />
        </div>

        <div>
          <Label>Quartier</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setLocationArea(area)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  locationArea === area
                    ? "bg-[#E8DFD3] text-stone-900"
                    : "bg-stone-100 text-stone-600",
                )}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="venue">Préférence de lieu</Label>
          <Input id="venue" className="mt-1.5" placeholder="Terrasse, restaurant..." value={venuePref} onChange={(e) => setVenuePref(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="min">Participants minimum</Label>
          <Input id="min" type="number" className="mt-1.5" value={minParticipants} onChange={(e) => setMinParticipants(Number(e.target.value))} min={2} />
        </div>

        <div>
          <Label>Invités</Label>
          <div className="mt-2 space-y-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => toggleContact(contact.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 transition-colors",
                  selectedContacts.includes(contact.id)
                    ? "border-stone-900 bg-stone-50"
                    : "border-stone-100 hover:border-stone-200",
                )}
              >
                <Avatar name={contact.name} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-900">{contact.name}</p>
                  <p className="text-xs text-stone-400">{contact.neighborhood ?? contact.relationship}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="mt-8 w-full"
        size="lg"
        disabled={!title || !activity || !dateStart || !locationArea}
        onClick={handleSubmit}
      >
        Créer et envoyer les invitations
      </Button>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense>
      <CreatePlanForm />
    </Suspense>
  );
}
