export function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

interface ICSPlan {
  id: string;
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

export function generateICS(plan: ICSPlan): string {
  const start = plan.confirmed_slot
    ? new Date(plan.confirmed_slot)
    : new Date(`${plan.date_start}T${plan.time_window_start}`);
  const end = new Date(start.getTime() + plan.duration_minutes * 60 * 1000);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hirnao//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${plan.id}@hirnao.app`,
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
}

export function downloadICS(plan: ICSPlan): void {
  const ics = generateICS(plan);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hirnao-${plan.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
