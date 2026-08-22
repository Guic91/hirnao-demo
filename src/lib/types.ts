export type PlanStatus =
  | "draft"
  | "collecting_availability"
  | "proposing"
  | "awaiting_confirmation"
  | "confirmed"
  | "cancelled"
  | "expired";

export type InviteeStatus =
  | "pending"
  | "invited"
  | "responded"
  | "confirmed"
  | "declined";

export type AvailabilityStatus = "available" | "tentative" | "unavailable";

export type VoteType = "confirm" | "decline" | "suggest_alternative";

export interface User {
  id: string;
  email: string;
  full_name: string;
  city: string;
  interests: string[];
  preferred_areas: string[];
  social_preferences: {
    group_size?: string;
    spontaneity?: string;
    budget?: string;
  };
  avatar_url?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  neighborhood?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  creator_id: string;
  title: string;
  activity: string;
  description?: string;
  date_start: string;
  date_end: string;
  time_window_start: string;
  time_window_end: string;
  duration_minutes: number;
  location_area: string;
  venue_preference?: string;
  min_participants: number;
  status: PlanStatus;
  confirmed_slot?: string;
  confirmed_venue?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanInvitee {
  id: string;
  plan_id: string;
  contact_id?: string;
  user_id?: string;
  name: string;
  email?: string;
  status: InviteeStatus;
  neighborhood?: string;
  created_at: string;
}

export interface AvailabilityResponse {
  id: string;
  plan_id: string;
  invitee_id: string;
  slot_date: string;
  slot_time: string;
  status: AvailabilityStatus;
  travel_minutes?: number;
  alternative_note?: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  plan_id: string;
  slot_date: string;
  slot_time: string;
  venue?: string;
  score: number;
  rank: number;
  confirmed_count: number;
  tentative_count: number;
  average_travel_minutes: number;
  late_hour_penalty: number;
  created_at: string;
}

export interface ProposalVote {
  id: string;
  proposal_id: string;
  invitee_id: string;
  vote: VoteType;
  alternative_date?: string;
  alternative_time?: string;
  note?: string;
  created_at: string;
}

export interface Message {
  id: string;
  plan_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface RankedSlot {
  slot_date: string;
  slot_time: string;
  score: number;
  confirmed_count: number;
  tentative_count: number;
  average_travel_minutes: number;
  late_hour_penalty: number;
  responses: AvailabilityResponse[];
}

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  draft: "Brouillon",
  collecting_availability: "Disponibilités",
  proposing: "Propositions",
  awaiting_confirmation: "Confirmation",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  expired: "Expiré",
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  collecting_availability: "bg-amber-50 text-amber-800",
  proposing: "bg-blue-50 text-blue-800",
  awaiting_confirmation: "bg-orange-50 text-orange-800",
  confirmed: "bg-green-50 text-green-800",
  cancelled: "bg-red-50 text-red-600",
  expired: "bg-neutral-100 text-neutral-500",
};
