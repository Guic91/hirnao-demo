import type {
  User,
  Contact,
  Plan,
  PlanInvitee,
  AvailabilityResponse,
  Proposal,
  ProposalVote,
  Message,
} from "./types";

export const DEMO_USER_ID = "u-001";

export const demoUser: User = {
  id: DEMO_USER_ID,
  email: "lea.martin@email.fr",
  full_name: "Léa Martin",
  city: "Paris",
  interests: ["restaurants", "expositions", "apéros", "randonnée urbaine"],
  preferred_areas: ["Marais", "Bastille", "Canal Saint-Martin", "Montmartre"],
  social_preferences: {
    group_size: "4-6 personnes",
    spontaneity: "modéré",
    budget: "moyen",
  },
  onboarding_completed: true,
  created_at: "2025-01-15T10:00:00Z",
};

export const demoContacts: Contact[] = [
  {
    id: "c-001",
    user_id: DEMO_USER_ID,
    name: "Thomas Dubois",
    email: "thomas.d@email.fr",
    relationship: "ami",
    neighborhood: "Bastille",
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "c-002",
    user_id: DEMO_USER_ID,
    name: "Camille Rousseau",
    email: "camille.r@email.fr",
    relationship: "ami",
    neighborhood: "Marais",
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "c-003",
    user_id: DEMO_USER_ID,
    name: "Hugo Bernard",
    email: "hugo.b@email.fr",
    relationship: "collègue",
    neighborhood: "République",
    created_at: "2025-01-16T10:00:00Z",
  },
  {
    id: "c-004",
    user_id: DEMO_USER_ID,
    name: "Emma Laurent",
    email: "emma.l@email.fr",
    relationship: "ami",
    neighborhood: "Montmartre",
    created_at: "2025-01-16T10:00:00Z",
  },
  {
    id: "c-005",
    user_id: DEMO_USER_ID,
    name: "Lucas Petit",
    email: "lucas.p@email.fr",
    relationship: "ami",
    neighborhood: "Canal Saint-Martin",
    created_at: "2025-01-17T10:00:00Z",
  },
  {
    id: "c-006",
    user_id: DEMO_USER_ID,
    name: "Chloé Moreau",
    email: "chloe.m@email.fr",
    relationship: "collègue",
    neighborhood: "Oberkampf",
    created_at: "2025-01-17T10:00:00Z",
  },
];

const nextFriday = getNextFriday();
const nextSaturday = getNextSaturday();

export const demoPlans: Plan[] = [
  {
    id: "p-001",
    creator_id: DEMO_USER_ID,
    title: "Apéro au Canal",
    activity: "Apéro entre amis",
    description: "Un apéro décontracté au bord du canal",
    date_start: nextFriday,
    date_end: nextSaturday,
    time_window_start: "18:00",
    time_window_end: "22:00",
    duration_minutes: 120,
    location_area: "Canal Saint-Martin",
    venue_preference: "Terrasse en bord de canal",
    min_participants: 3,
    status: "proposing",
    created_at: "2025-08-18T14:00:00Z",
    updated_at: "2025-08-20T10:00:00Z",
  },
  {
    id: "p-002",
    creator_id: DEMO_USER_ID,
    title: "Brunch du dimanche",
    activity: "Brunch",
    description: "Brunch dominical dans le Marais",
    date_start: getNextSunday(),
    date_end: getNextSunday(),
    time_window_start: "10:00",
    time_window_end: "14:00",
    duration_minutes: 90,
    location_area: "Marais",
    venue_preference: "Restaurant avec terrasse",
    min_participants: 2,
    status: "collecting_availability",
    created_at: "2025-08-19T09:00:00Z",
    updated_at: "2025-08-19T09:00:00Z",
  },
  {
    id: "p-003",
    creator_id: DEMO_USER_ID,
    title: "Expo au Centre Pompidou",
    activity: "Exposition",
    date_start: "2025-08-10",
    date_end: "2025-08-10",
    time_window_start: "14:00",
    time_window_end: "18:00",
    duration_minutes: 120,
    location_area: "Beaubourg",
    min_participants: 2,
    status: "confirmed",
    confirmed_slot: "2025-08-10T15:00:00Z",
    confirmed_venue: "Centre Pompidou — Café Beaubourg",
    created_at: "2025-08-01T10:00:00Z",
    updated_at: "2025-08-05T16:00:00Z",
  },
];

export const demoInvitees: PlanInvitee[] = [
  {
    id: "pi-001",
    plan_id: "p-001",
    contact_id: "c-001",
    name: "Thomas Dubois",
    email: "thomas.d@email.fr",
    status: "responded",
    neighborhood: "Bastille",
    created_at: "2025-08-18T14:30:00Z",
  },
  {
    id: "pi-002",
    plan_id: "p-001",
    contact_id: "c-002",
    name: "Camille Rousseau",
    email: "camille.r@email.fr",
    status: "responded",
    neighborhood: "Marais",
    created_at: "2025-08-18T14:30:00Z",
  },
  {
    id: "pi-003",
    plan_id: "p-001",
    contact_id: "c-005",
    name: "Lucas Petit",
    email: "lucas.p@email.fr",
    status: "responded",
    neighborhood: "Canal Saint-Martin",
    created_at: "2025-08-18T14:30:00Z",
  },
  {
    id: "pi-004",
    plan_id: "p-001",
    contact_id: "c-004",
    name: "Emma Laurent",
    email: "emma.l@email.fr",
    status: "invited",
    neighborhood: "Montmartre",
    created_at: "2025-08-18T14:30:00Z",
  },
  {
    id: "pi-005",
    plan_id: "p-002",
    contact_id: "c-001",
    name: "Thomas Dubois",
    status: "invited",
    neighborhood: "Bastille",
    created_at: "2025-08-19T09:30:00Z",
  },
  {
    id: "pi-006",
    plan_id: "p-002",
    contact_id: "c-003",
    name: "Hugo Bernard",
    status: "invited",
    neighborhood: "République",
    created_at: "2025-08-19T09:30:00Z",
  },
  {
    id: "pi-007",
    plan_id: "p-003",
    contact_id: "c-002",
    name: "Camille Rousseau",
    status: "confirmed",
    neighborhood: "Marais",
    created_at: "2025-08-01T10:30:00Z",
  },
  {
    id: "pi-008",
    plan_id: "p-003",
    contact_id: "c-006",
    name: "Chloé Moreau",
    status: "confirmed",
    neighborhood: "Oberkampf",
    created_at: "2025-08-01T10:30:00Z",
  },
];

export const demoAvailability: AvailabilityResponse[] = [
  // Thomas - Apéro
  { id: "ar-001", plan_id: "p-001", invitee_id: "pi-001", slot_date: nextFriday, slot_time: "19:00", status: "available", travel_minutes: 12, created_at: "2025-08-19T10:00:00Z" },
  { id: "ar-002", plan_id: "p-001", invitee_id: "pi-001", slot_date: nextFriday, slot_time: "19:30", status: "available", travel_minutes: 12, created_at: "2025-08-19T10:00:00Z" },
  { id: "ar-003", plan_id: "p-001", invitee_id: "pi-001", slot_date: nextFriday, slot_time: "20:00", status: "tentative", travel_minutes: 12, created_at: "2025-08-19T10:00:00Z" },
  { id: "ar-004", plan_id: "p-001", invitee_id: "pi-001", slot_date: nextSaturday, slot_time: "18:00", status: "available", travel_minutes: 12, created_at: "2025-08-19T10:00:00Z" },
  // Camille - Apéro
  { id: "ar-005", plan_id: "p-001", invitee_id: "pi-002", slot_date: nextFriday, slot_time: "19:00", status: "available", travel_minutes: 8, created_at: "2025-08-19T11:00:00Z" },
  { id: "ar-006", plan_id: "p-001", invitee_id: "pi-002", slot_date: nextFriday, slot_time: "19:30", status: "available", travel_minutes: 8, created_at: "2025-08-19T11:00:00Z" },
  { id: "ar-007", plan_id: "p-001", invitee_id: "pi-002", slot_date: nextFriday, slot_time: "20:00", status: "available", travel_minutes: 8, created_at: "2025-08-19T11:00:00Z" },
  { id: "ar-008", plan_id: "p-001", invitee_id: "pi-002", slot_date: nextSaturday, slot_time: "18:30", status: "tentative", travel_minutes: 8, created_at: "2025-08-19T11:00:00Z" },
  // Lucas - Apéro
  { id: "ar-009", plan_id: "p-001", invitee_id: "pi-003", slot_date: nextFriday, slot_time: "19:00", status: "available", travel_minutes: 3, created_at: "2025-08-19T12:00:00Z" },
  { id: "ar-010", plan_id: "p-001", invitee_id: "pi-003", slot_date: nextFriday, slot_time: "19:30", status: "available", travel_minutes: 3, created_at: "2025-08-19T12:00:00Z" },
  { id: "ar-011", plan_id: "p-001", invitee_id: "pi-003", slot_date: nextFriday, slot_time: "20:00", status: "available", travel_minutes: 3, created_at: "2025-08-19T12:00:00Z" },
  { id: "ar-012", plan_id: "p-001", invitee_id: "pi-003", slot_date: nextSaturday, slot_time: "18:00", status: "available", travel_minutes: 3, created_at: "2025-08-19T12:00:00Z" },
];

export const demoProposals: Proposal[] = [];
export const demoVotes: ProposalVote[] = [];
export const demoMessages: Message[] = [
  {
    id: "m-001",
    plan_id: "p-001",
    sender_id: DEMO_USER_ID,
    sender_name: "Léa Martin",
    content: "Salut tout le monde ! Qui est dispo pour un apéro au canal ce week-end ?",
    created_at: "2025-08-18T14:35:00Z",
  },
  {
    id: "m-002",
    plan_id: "p-001",
    sender_id: "c-001",
    sender_name: "Thomas Dubois",
    content: "Chaud ! Le vendredi soir c'est parfait pour moi.",
    created_at: "2025-08-19T10:05:00Z",
  },
];

function getNextFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getNextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (7 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
