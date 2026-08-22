"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { formatDateTimeFr } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ConfirmProposalPage({
  params,
}: {
  params: Promise<{ id: string; proposalId: string }>;
}) {
  const { id, proposalId } = use(params);
  const router = useRouter();
  const { plans, getPlanProposals, getPlanInvitees, submitVote, confirmPlan } = useApp();

  const plan = plans.find((p) => p.id === id);
  const proposals = getPlanProposals(id);
  const proposal = proposals.find((p) => p.id === proposalId);
  const invitees = getPlanInvitees(id);
  const currentInvitee = invitees[0];

  const [showAlternative, setShowAlternative] = useState(false);
  const [altDate, setAltDate] = useState("");
  const [altTime, setAltTime] = useState("");
  const [altNote, setAltNote] = useState("");

  if (!plan || !proposal || !currentInvitee) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-stone-400">Proposition introuvable</p>
      </div>
    );
  }

  const handleConfirm = () => {
    submitVote(proposalId, currentInvitee.id, "confirm");
    confirmPlan(id, proposalId);
    router.push(`/plans/${id}/confirmed`);
  };

  const handleDecline = () => {
    submitVote(proposalId, currentInvitee.id, "decline");
    router.push(`/plans/${id}`);
  };

  const handleSuggestAlternative = () => {
    submitVote(proposalId, currentInvitee.id, "suggest_alternative", {
      date: altDate,
      time: altTime,
      note: altNote,
    });
    router.push(`/plans/${id}`);
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <Link
        href={`/plans/${id}`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au plan
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Confirmer le créneau</h1>
      <p className="mt-1 text-sm text-stone-500">{plan.title}</p>

      <Card className="mt-6 border-[#E8DFD3] bg-[#E8DFD3]/10">
        <CardContent className="p-5">
          <p className="text-lg font-semibold text-stone-900">
            {formatDateTimeFr(proposal.slot_date, proposal.slot_time)}
          </p>
          {proposal.venue && (
            <p className="mt-1 text-sm text-stone-500">{proposal.venue}</p>
          )}
          <div className="mt-4 flex gap-4 text-sm text-stone-500">
            <span>{proposal.confirmed_count} confirmés</span>
            <span>{proposal.tentative_count} tentatifs</span>
            <span>Score {Math.round(proposal.score)}</span>
          </div>
        </CardContent>
      </Card>

      {!showAlternative ? (
        <div className="mt-8 space-y-3">
          <Button className="w-full" size="lg" onClick={handleConfirm}>
            <Check className="h-4 w-4" />
            Je confirme
          </Button>
          <Button variant="outline" className="w-full" size="lg" onClick={handleDecline}>
            <X className="h-4 w-4" />
            Je décline
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAlternative(true)}
          >
            <Clock className="h-4 w-4" />
            Proposer un autre créneau
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="altDate">Date</Label>
              <Input
                id="altDate"
                type="date"
                className="mt-1.5"
                value={altDate}
                onChange={(e) => setAltDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="altTime">Heure</Label>
              <Input
                id="altTime"
                type="time"
                className="mt-1.5"
                value={altTime}
                onChange={(e) => setAltTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="altNote">Note</Label>
            <Input
              id="altNote"
              className="mt-1.5"
              placeholder="Pourquoi ce créneau ?"
              value={altNote}
              onChange={(e) => setAltNote(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!altDate || !altTime}
            onClick={handleSuggestAlternative}
          >
            Envoyer l&apos;alternative
          </Button>
          <button
            onClick={() => setShowAlternative(false)}
            className={cn("w-full text-center text-sm text-stone-500")}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
