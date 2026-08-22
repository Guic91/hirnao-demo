import { NextRequest, NextResponse } from "next/server";

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;

  // In production, fetch from Supabase. For demo, use static data.
  const plan = getDemoPlan(planId);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const start = plan.confirmed_slot
    ? new Date(plan.confirmed_slot)
    : new Date(`${plan.date_start}T${plan.time_window_start}`);
  const end = new Date(start.getTime() + plan.duration_minutes * 60 * 1000);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hirnao//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${planId}@hirnao.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${plan.title}`,
    `DESCRIPTION:${plan.activity}${plan.description ? ` - ${plan.description}` : ""}`,
    `LOCATION:${plan.confirmed_venue ?? plan.location_area}, Paris`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hirnao-${planId}.ics"`,
    },
  });
}

function getDemoPlan(planId: string) {
  const plans: Record<
    string,
    {
      title: string;
      activity: string;
      description?: string;
      date_start: string;
      time_window_start: string;
      duration_minutes: number;
      location_area: string;
      confirmed_slot?: string;
      confirmed_venue?: string;
    }
  > = {
    "p-003": {
      title: "Expo au Centre Pompidou",
      activity: "Exposition",
      date_start: "2025-08-10",
      time_window_start: "15:00",
      duration_minutes: 120,
      location_area: "Beaubourg",
      confirmed_slot: "2025-08-10T15:00:00Z",
      confirmed_venue: "Centre Pompidou — Café Beaubourg",
    },
  };

  return plans[planId] ?? null;
}
