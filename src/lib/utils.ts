import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateFr(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatTimeFr(time: string): string {
  const [h, m] = time.split(":");
  return `${h}h${m === "00" ? "" : m}`;
}

export function formatDateTimeFr(date: string, time: string): string {
  return `${formatDateFr(date)}, ${formatTimeFr(time)}`;
}
