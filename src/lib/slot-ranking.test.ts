import { describe, it, expect } from "vitest";
import { rankSlots, generateTimeSlots } from "./slot-ranking";
import type { AvailabilityResponse } from "./types";

describe("rankSlots", () => {
  const baseResponse = (
    overrides: Partial<AvailabilityResponse>,
  ): AvailabilityResponse => ({
    id: "1",
    plan_id: "p-1",
    invitee_id: "i-1",
    slot_date: "2025-08-22",
    slot_time: "19:00",
    status: "available",
    travel_minutes: 10,
    created_at: "2025-08-20T10:00:00Z",
    ...overrides,
  });

  it("ranks slots by score descending", () => {
    const responses: AvailabilityResponse[] = [
      baseResponse({ invitee_id: "i-1", slot_time: "19:00", status: "available", travel_minutes: 5 }),
      baseResponse({ invitee_id: "i-2", slot_time: "19:00", status: "available", travel_minutes: 5 }),
      baseResponse({ invitee_id: "i-1", slot_time: "20:00", status: "tentative", travel_minutes: 5 }),
    ];

    const ranked = rankSlots(responses);
    expect(ranked[0].slot_time).toBe("19:00");
    expect(ranked[0].confirmed_count).toBe(2);
    expect(ranked[0].score).toBe(200 - 5 * 2); // 2 confirmed, avg travel 5
  });

  it("applies late hour penalty", () => {
    const early = rankSlots([
      baseResponse({ slot_time: "19:00", travel_minutes: 0 }),
    ]);
    const late = rankSlots([
      baseResponse({ slot_time: "22:00", travel_minutes: 0 }),
    ]);

    expect(early[0].score).toBeGreaterThan(late[0].score);
    expect(late[0].late_hour_penalty).toBe(50);
  });

  it("excludes unavailable responses", () => {
    const ranked = rankSlots([
      baseResponse({ status: "unavailable" }),
    ]);
    expect(ranked).toHaveLength(0);
  });

  it("is deterministic with tie-breaking by date then time", () => {
    const responses: AvailabilityResponse[] = [
      baseResponse({ invitee_id: "i-1", slot_date: "2025-08-23", slot_time: "18:00", travel_minutes: 10 }),
      baseResponse({ invitee_id: "i-1", slot_date: "2025-08-22", slot_time: "19:00", travel_minutes: 10 }),
    ];

    const ranked = rankSlots(responses);
    expect(ranked[0].slot_date).toBe("2025-08-22");
    expect(ranked[1].slot_date).toBe("2025-08-23");
  });
});

describe("generateTimeSlots", () => {
  it("generates slots within time window", () => {
    const slots = generateTimeSlots("2025-08-22", "2025-08-22", "18:00", "20:00", 60);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].slot_time).toBe("18:00");
    expect(slots.every((s) => s.slot_date === "2025-08-22")).toBe(true);
  });
});
