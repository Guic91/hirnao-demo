import { z } from "zod";

export const localeSchema = z.enum(["fr", "en"]);

export const privacyLevelSchema = z.enum([
  "public",
  "matchable",
  "agent_to_agent",
  "after_connection",
  "private",
  "ephemeral",
]);

// ─── Onboarding (agent exchange) ─────────────────────────────────────────────

export const onboardingMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  event_id: z.string().uuid().optional(),
});

export const cardProfileInputSchema = z.object({
  headline: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  activity: z.string().max(120).optional(),
  interests: z.array(z.string()).max(20).default([]),
  expertises: z.array(z.string()).max(20).default([]),
  intentions: z.array(z.string()).max(10).default([]),
  seeking: z.array(z.string()).max(10).default([]),
  offering: z.array(z.string()).max(10).default([]),
  preferences: z.record(z.unknown()).default({}),
  constraints: z.record(z.unknown()).default({}),
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  venue_name: z.string().max(200).optional(),
  venue_address: z.string().max(500).optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  default_locale: localeSchema.default("fr"),
  supported_locales: z.array(localeSchema).default(["fr", "en"]),
  settings: z
    .object({
      max_participants: z.number().int().positive().optional(),
      require_approval: z.boolean().default(false),
      geolocation_zones_enabled: z.boolean().default(true),
      agent_matching_enabled: z.boolean().default(true),
      auto_expire_visibility: z.boolean().default(true),
    })
    .default({}),
});

export const joinEventSchema = z.object({
  qr_token: z.string().min(8).optional(),
  event_slug: z.string().optional(),
});

// ─── Matching & connections ──────────────────────────────────────────────────

export const recommendationActionSchema = z.object({
  action: z.enum(["connect", "later", "dismiss"]),
});

export const connectionRequestSchema = z.object({
  recipient_id: z.string().uuid(),
  message: z.string().max(500).optional(),
  recommendation_id: z.string().uuid().optional(),
});

export const connectionResponseSchema = z.object({
  action: z.enum(["accept", "decline", "block"]),
});

export const meetingFeedbackSchema = z.object({
  met: z.boolean(),
  relevance: z.enum(["positive", "negative"]).optional(),
  note: z.string().max(500).optional(),
});

// ─── Geolocation ─────────────────────────────────────────────────────────────

export const visibilityUpdateSchema = z.object({
  visible: z.boolean(),
  zone_id: z.string().uuid().optional(),
  zone_label: z.string().max(100).optional(),
});

// ─── Messaging ───────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});
