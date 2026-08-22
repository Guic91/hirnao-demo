import type { AvailabilityResponse, RankedSlot } from "./types";

interface SlotKey {
  slot_date: string;
  slot_time: string;
}

function slotKey(slot: SlotKey): string {
  return `${slot.slot_date}T${slot.slot_time}`;
}

function computeLateHourPenalty(time: string): number {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 22) return 50;
  if (hour >= 21) return 30;
  if (hour >= 20) return 10;
  return 0;
}

/**
 * Deterministic slot-ranking algorithm:
 * score = confirmed*100 + tentative*35 - avg_travel*2 - late_hour_penalty
 */
export function rankSlots(
  responses: AvailabilityResponse[],
): RankedSlot[] {
  const grouped = new Map<string, AvailabilityResponse[]>();

  for (const response of responses) {
    if (response.status === "unavailable") continue;
    const key = slotKey(response);
    const existing = grouped.get(key) ?? [];
    existing.push(response);
    grouped.set(key, existing);
  }

  const ranked: RankedSlot[] = [];

  for (const [, slotResponses] of grouped) {
    const { slot_date, slot_time } = slotResponses[0];
    const confirmed_count = slotResponses.filter(
      (r) => r.status === "available",
    ).length;
    const tentative_count = slotResponses.filter(
      (r) => r.status === "tentative",
    ).length;

    const travelTimes = slotResponses
      .map((r) => r.travel_minutes ?? 0)
      .filter((t) => t > 0);
    const average_travel_minutes =
      travelTimes.length > 0
        ? travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length
        : 0;

    const late_hour_penalty = computeLateHourPenalty(slot_time);

    const score =
      confirmed_count * 100 +
      tentative_count * 35 -
      average_travel_minutes * 2 -
      late_hour_penalty;

    ranked.push({
      slot_date,
      slot_time,
      score,
      confirmed_count,
      tentative_count,
      average_travel_minutes,
      late_hour_penalty,
      responses: slotResponses,
    });
  }

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.slot_date !== b.slot_date) return a.slot_date.localeCompare(b.slot_date);
    return a.slot_time.localeCompare(b.slot_time);
  });
}

export function generateTimeSlots(
  dateStart: string,
  dateEnd: string,
  windowStart: string,
  windowEnd: string,
  durationMinutes: number,
): { slot_date: string; slot_time: string }[] {
  const slots: { slot_date: string; slot_time: string }[] = [];
  const start = new Date(dateStart);
  const end = new Date(dateEnd);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const [startH, startM] = windowStart.split(":").map(Number);
    const [endH, endM] = windowEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + durationMinutes <= endMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push({
        slot_date: dateStr,
        slot_time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      });
    }
  }

  return slots;
}
