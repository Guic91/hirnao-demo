import type { EventKPIs } from "@hirnao/shared";

export interface KpiRawData {
  participants: number;
  activated: number;
  recommendations_generated: number;
  recommendations_opened: number;
  connections_sent: number;
  connections_accepted: number;
  meetings_met: number;
  feedback_positive: number;
  feedback_total: number;
  returning_users: number;
}

export function computeKpis(eventId: string, raw: KpiRawData): EventKPIs {
  const {
    participants,
    activated,
    recommendations_generated,
    recommendations_opened,
    connections_sent,
    connections_accepted,
    meetings_met,
    feedback_positive,
    feedback_total,
    returning_users,
  } = raw;

  return {
    event_id: eventId,
    participants,
    activation_rate: participants > 0 ? round(activated / participants) : 0,
    recommendations_generated,
    recommendations_opened,
    connections_sent,
    acceptance_rate: connections_sent > 0 ? round(connections_accepted / connections_sent) : 0,
    meeting_rate: connections_accepted > 0 ? round(meetings_met / connections_accepted) : 0,
    relevance_positive_rate: feedback_total > 0 ? round(feedback_positive / feedback_total) : 0,
    return_rate: participants > 0 ? round(returning_users / participants) : 0,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export const KPI_LABELS = {
  fr: {
    participants: "Participants",
    activation_rate: "Taux d'activation",
    recommendations_generated: "Recommandations générées",
    recommendations_opened: "Recommandations consultées",
    connections_sent: "Connexions envoyées",
    acceptance_rate: "Taux d'acceptation",
    meeting_rate: "Taux de rencontre",
    relevance_positive_rate: "Pertinence positive",
    return_rate: "Taux de retour",
  },
  en: {
    participants: "Participants",
    activation_rate: "Activation rate",
    recommendations_generated: "Recommendations generated",
    recommendations_opened: "Recommendations opened",
    connections_sent: "Connections sent",
    acceptance_rate: "Acceptance rate",
    meeting_rate: "Meeting rate",
    relevance_positive_rate: "Positive relevance",
    return_rate: "Return rate",
  },
} as const;
