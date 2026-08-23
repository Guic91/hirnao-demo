import type { EventData, UserData } from "../api";

export const EVENT_ID = "10000000-0000-0000-0000-000000000001";
export const ORGANIZER_ID = "00000000-0000-0000-0000-000000000001";
export const ADMIN_ID = "00000000-0000-0000-0000-000000000099";

export const DEMO_EVENT: EventData & { id: string; organizer_id: string } = {
  id: EVENT_ID,
  organizer_id: ORGANIZER_ID,
  slug: "ai-summit-paris-2026",
  title: "AI Summit Paris 2026",
  description: "Conférence sur l'IA appliquée à l'événementiel et au networking.",
  venue_name: "Station F",
  starts_at: new Date(Date.now() + 86400000).toISOString(),
  ends_at: new Date(Date.now() + 86400000 + 28800000).toISOString(),
  status: "published",
  default_locale: "fr",
};

export const SEED_USERS: UserData[] = [
  { id: ADMIN_ID, email: "admin@hirnao.app", display_name: "Admin Hirnao", locale: "fr", role: "admin" },
  { id: ORGANIZER_ID, email: "organizer@hirnao.app", display_name: "Marie Organisatrice", locale: "fr", role: "organizer" },
  { id: "00000000-0000-0000-0000-000000000002", email: "sophie@demo.app", display_name: "Sophie Martin", locale: "fr", role: "participant" },
  { id: "00000000-0000-0000-0000-000000000003", email: "alex@demo.app", display_name: "Alex Chen", locale: "en", role: "participant" },
  { id: "00000000-0000-0000-0000-000000000004", email: "lucas@demo.app", display_name: "Lucas Dubois", locale: "fr", role: "participant" },
];

export interface DemoCard {
  id: string;
  user_id: string;
  context_id: string;
  headline?: string;
  bio?: string;
  activity?: string;
  interests: string[];
  expertises: string[];
  intentions: string[];
  seeking: string[];
  offering: string[];
  completeness_score: number;
}

export const SEED_CARDS: DemoCard[] = [
  {
    id: "c0000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000002",
    context_id: EVENT_ID,
    headline: "Product Manager IA",
    bio: "Passionnée par l'IA appliquée aux produits B2B.",
    activity: "Product Management",
    interests: ["IA", "SaaS", "UX"],
    expertises: ["Product strategy", "LLM integration"],
    intentions: ["Rencontrer des experts techniques"],
    seeking: ["Co-fondateur technique"],
    offering: ["Vision produit", "Go-to-market"],
    completeness_score: 0.88,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    user_id: "00000000-0000-0000-0000-000000000003",
    context_id: EVENT_ID,
    headline: "ML Engineer",
    bio: "Building production ML systems.",
    activity: "Engineering",
    interests: ["ML", "NLP", "Startups"],
    expertises: ["Python", "Vector search", "LLM fine-tuning"],
    intentions: ["Find business partners"],
    seeking: ["Technical co-founder"],
    offering: ["ML architecture", "MLOps"],
    completeness_score: 0.88,
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    user_id: "00000000-0000-0000-0000-000000000004",
    context_id: EVENT_ID,
    headline: "Event Tech Founder",
    bio: "Je crée des outils pour l'événementiel.",
    activity: "Entrepreneur",
    interests: ["Événementiel", "IA", "Networking"],
    expertises: ["Event platforms", "Matchmaking"],
    intentions: ["Investisseurs", "Clients B2B"],
    seeking: ["Innovation événementielle"],
    offering: ["Démos", "Partenariats"],
    completeness_score: 0.88,
  },
];
