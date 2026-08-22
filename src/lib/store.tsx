"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  User,
  Contact,
  Plan,
  PlanInvitee,
  AvailabilityResponse,
  Proposal,
  ProposalVote,
  Message,
  PlanStatus,
  AvailabilityStatus,
  VoteType,
} from "@/lib/types";
import { rankSlots } from "@/lib/slot-ranking";
import {
  demoUser,
  demoContacts,
  demoPlans,
  demoInvitees,
  demoAvailability,
  demoProposals,
  demoVotes,
  demoMessages,
  DEMO_USER_ID,
} from "@/lib/mock-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AppState {
  user: User;
  contacts: Contact[];
  plans: Plan[];
  invitees: PlanInvitee[];
  availability: AvailabilityResponse[];
  proposals: Proposal[];
  votes: ProposalVote[];
  messages: Message[];
}

interface AppContextValue extends AppState {
  updateUser: (data: Partial<User>) => void;
  addContact: (contact: Omit<Contact, "id" | "created_at" | "user_id">) => void;
  createPlan: (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "creator_id" | "status">) => string;
  updatePlan: (id: string, data: Partial<Plan>) => void;
  addInvitees: (planId: string, contactIds: string[]) => void;
  submitAvailability: (
    planId: string,
    inviteeId: string,
    slots: { slot_date: string; slot_time: string; status: AvailabilityStatus; travel_minutes?: number }[],
    unavailable?: boolean,
    alternativeNote?: string,
  ) => void;
  generateProposals: (planId: string) => void;
  submitVote: (
    proposalId: string,
    inviteeId: string,
    vote: VoteType,
    alternative?: { date?: string; time?: string; note?: string },
  ) => void;
  confirmPlan: (planId: string, proposalId: string) => void;
  addMessage: (planId: string, content: string) => void;
  getPlanInvitees: (planId: string) => PlanInvitee[];
  getPlanAvailability: (planId: string) => AvailabilityResponse[];
  getPlanProposals: (planId: string) => Proposal[];
  getPlanMessages: (planId: string) => Message[];
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: demoUser,
    contacts: demoContacts,
    plans: demoPlans,
    invitees: demoInvitees,
    availability: demoAvailability,
    proposals: demoProposals,
    votes: demoVotes,
    messages: demoMessages,
  });

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    if (!supabase) return;

    Promise.all([
      supabase.from("plans").select("*").order("created_at", { ascending: false }),
      supabase.from("plan_invitees").select("*"),
      supabase.from("availability_responses").select("*"),
      supabase.from("proposals").select("*").order("rank"),
      supabase.from("proposal_votes").select("*"),
      supabase.from("messages").select("*").order("created_at"),
      supabase.from("contacts").select("*"),
    ]).then(([plans, invitees, availability, proposals, votes, messages, contacts]) => {
      setState((prev) => ({
        ...prev,
        plans: (plans.data as Plan[]) ?? prev.plans,
        invitees: (invitees.data as PlanInvitee[]) ?? prev.invitees,
        availability: (availability.data as AvailabilityResponse[]) ?? prev.availability,
        proposals: (proposals.data as Proposal[]) ?? prev.proposals,
        votes: (votes.data as ProposalVote[]) ?? prev.votes,
        messages: (messages.data as Message[]) ?? prev.messages,
        contacts: (contacts.data as Contact[]) ?? prev.contacts,
      }));
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    if (!supabase) return;

    refresh();

    const channel = supabase
      .channel("hirnao-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_invitees" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "availability_responses" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposal_votes" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const updateUser = useCallback((data: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, ...data, onboarding_completed: true },
    }));
  }, []);

  const addContact = useCallback(
    (contact: Omit<Contact, "id" | "created_at" | "user_id">) => {
      const newContact: Contact = {
        ...contact,
        id: uid(),
        user_id: DEMO_USER_ID,
        created_at: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, contacts: [...prev.contacts, newContact] }));
    },
    [],
  );

  const createPlan = useCallback(
    (
      plan: Omit<Plan, "id" | "created_at" | "updated_at" | "creator_id" | "status">,
    ): string => {
      const id = uid();
      const newPlan: Plan = {
        ...plan,
        id,
        creator_id: DEMO_USER_ID,
        status: "collecting_availability",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, plans: [newPlan, ...prev.plans] }));
      return id;
    },
    [],
  );

  const updatePlan = useCallback((id: string, data: Partial<Plan>) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p,
      ),
    }));
  }, []);

  const addInvitees = useCallback((planId: string, contactIds: string[]) => {
    setState((prev) => {
      const newInvitees = contactIds.map((contactId) => {
        const contact = prev.contacts.find((c) => c.id === contactId)!;
        return {
          id: uid(),
          plan_id: planId,
          contact_id: contactId,
          name: contact.name,
          email: contact.email,
          status: "invited" as const,
          neighborhood: contact.neighborhood,
          created_at: new Date().toISOString(),
        };
      });
      return { ...prev, invitees: [...prev.invitees, ...newInvitees] };
    });
  }, []);

  const submitAvailability = useCallback(
    (
      planId: string,
      inviteeId: string,
      slots: { slot_date: string; slot_time: string; status: AvailabilityStatus; travel_minutes?: number }[],
      unavailable?: boolean,
      alternativeNote?: string,
    ) => {
      setState((prev) => {
        const filtered = prev.availability.filter((a) => a.invitee_id !== inviteeId);
        const newResponses: AvailabilityResponse[] = unavailable
          ? []
          : slots.map((s) => ({
              id: uid(),
              plan_id: planId,
              invitee_id: inviteeId,
              slot_date: s.slot_date,
              slot_time: s.slot_time,
              status: s.status,
              travel_minutes: s.travel_minutes,
              alternative_note: alternativeNote,
              created_at: new Date().toISOString(),
            }));

        const updatedInvitees = prev.invitees.map((inv) =>
          inv.id === inviteeId
            ? { ...inv, status: unavailable ? ("declined" as const) : ("responded" as const) }
            : inv,
        );

        const allResponded = updatedInvitees
          .filter((inv) => inv.plan_id === planId)
          .every((inv) => inv.status === "responded" || inv.status === "declined");

        const updatedPlans = prev.plans.map((p) =>
          p.id === planId && allResponded
            ? { ...p, status: "proposing" as PlanStatus, updated_at: new Date().toISOString() }
            : p,
        );

        return {
          ...prev,
          availability: [...filtered, ...newResponses],
          invitees: updatedInvitees,
          plans: updatedPlans,
        };
      });
    },
    [],
  );

  const generateProposals = useCallback((planId: string) => {
    setState((prev) => {
      const responses = prev.availability.filter((a) => a.plan_id === planId);
      const ranked = rankSlots(responses);
      const plan = prev.plans.find((p) => p.id === planId);

      const newProposals: Proposal[] = ranked.slice(0, 5).map((slot, i) => ({
        id: uid(),
        plan_id: planId,
        slot_date: slot.slot_date,
        slot_time: slot.slot_time,
        venue: plan?.venue_preference,
        score: slot.score,
        rank: i + 1,
        confirmed_count: slot.confirmed_count,
        tentative_count: slot.tentative_count,
        average_travel_minutes: slot.average_travel_minutes,
        late_hour_penalty: slot.late_hour_penalty,
        created_at: new Date().toISOString(),
      }));

      const updatedPlans = prev.plans.map((p) =>
        p.id === planId
          ? { ...p, status: "awaiting_confirmation" as PlanStatus, updated_at: new Date().toISOString() }
          : p,
      );

      return {
        ...prev,
        proposals: [
          ...prev.proposals.filter((p) => p.plan_id !== planId),
          ...newProposals,
        ],
        plans: updatedPlans,
      };
    });
  }, []);

  const submitVote = useCallback(
    (
      proposalId: string,
      inviteeId: string,
      vote: VoteType,
      alternative?: { date?: string; time?: string; note?: string },
    ) => {
      setState((prev) => {
        const newVote: ProposalVote = {
          id: uid(),
          proposal_id: proposalId,
          invitee_id: inviteeId,
          vote,
          alternative_date: alternative?.date,
          alternative_time: alternative?.time,
          note: alternative?.note,
          created_at: new Date().toISOString(),
        };

        const proposal = prev.proposals.find((p) => p.id === proposalId);
        const planId = proposal?.plan_id;
        const planInvitees = prev.invitees.filter((inv) => inv.plan_id === planId);
        const existingVotes = [
          ...prev.votes.filter((v) => v.proposal_id !== proposalId || v.invitee_id !== inviteeId),
          newVote,
        ];
        const proposalVotes = existingVotes.filter((v) => v.proposal_id === proposalId);
        const allVoted = planInvitees
          .filter((inv) => inv.status !== "declined")
          .every((inv) => proposalVotes.some((v) => v.invitee_id === inv.id));

        const confirmCount = proposalVotes.filter((v) => v.vote === "confirm").length;
        const allConfirmed = allVoted && confirmCount === planInvitees.filter((inv) => inv.status !== "declined").length;

        let updatedPlans = prev.plans;
        if (allConfirmed && planId && proposal) {
          updatedPlans = prev.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  status: "confirmed" as PlanStatus,
                  confirmed_slot: `${proposal.slot_date}T${proposal.slot_time}:00Z`,
                  confirmed_venue: proposal.venue,
                  updated_at: new Date().toISOString(),
                }
              : p,
          );
        }

        return {
          ...prev,
          votes: existingVotes,
          plans: updatedPlans,
        };
      });
    },
    [],
  );

  const confirmPlan = useCallback((planId: string, proposalId: string) => {
    setState((prev) => {
      const proposal = prev.proposals.find((p) => p.id === proposalId);
      if (!proposal) return prev;

      return {
        ...prev,
        plans: prev.plans.map((p) =>
          p.id === planId
            ? {
                ...p,
                status: "confirmed" as PlanStatus,
                confirmed_slot: `${proposal.slot_date}T${proposal.slot_time}:00Z`,
                confirmed_venue: proposal.venue,
                updated_at: new Date().toISOString(),
              }
            : p,
        ),
      };
    });
  }, []);

  const addMessage = useCallback((planId: string, content: string) => {
    setState((prev) => {
      const msg: Message = {
        id: uid(),
        plan_id: planId,
        sender_id: prev.user.id,
        sender_name: prev.user.full_name,
        content,
        created_at: new Date().toISOString(),
      };
      return { ...prev, messages: [...prev.messages, msg] };
    });
  }, []);

  const getPlanInvitees = useCallback(
    (planId: string) => state.invitees.filter((inv) => inv.plan_id === planId),
    [state.invitees],
  );

  const getPlanAvailability = useCallback(
    (planId: string) => state.availability.filter((a) => a.plan_id === planId),
    [state.availability],
  );

  const getPlanProposals = useCallback(
    (planId: string) =>
      state.proposals
        .filter((p) => p.plan_id === planId)
        .sort((a, b) => a.rank - b.rank),
    [state.proposals],
  );

  const getPlanMessages = useCallback(
    (planId: string) =>
      state.messages
        .filter((m) => m.plan_id === planId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [state.messages],
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        updateUser,
        addContact,
        createPlan,
        updatePlan,
        addInvitees,
        submitAvailability,
        generateProposals,
        submitVote,
        confirmPlan,
        addMessage,
        getPlanInvitees,
        getPlanAvailability,
        getPlanProposals,
        getPlanMessages,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
