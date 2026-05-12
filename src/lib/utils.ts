import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";
import type { Division, MatchStatus, PlayerPosition, NewsCategory } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today, ${format(date, "HH:mm")}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm")}`;
  return format(date, "EEE d MMM, HH:mm");
}

export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMMM yyyy");
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function getDivisionLabel(division: Division): string {
  const labels: Record<Division, string> = {
    premier: "Premier League",
    division_one: "Division One",
    division_two: "Division Two",
    junior: "Junior League",
    women: "Women's League",
  };
  return labels[division] ?? division;
}

export function getStatusColor(status: MatchStatus): string {
  switch (status) {
    case "live": return "bg-red-100 text-red-700 border-red-200";
    case "finished": return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "scheduled": return "bg-blue-100 text-blue-700 border-blue-200";
    case "postponed": return "bg-amber-100 text-amber-700 border-amber-200";
    case "cancelled": return "bg-red-100 text-red-500 border-red-200";
  }
}

export function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case "live": return "LIVE";
    case "finished": return "FT";
    case "scheduled": return "Upcoming";
    case "postponed": return "Postponed";
    case "cancelled": return "Cancelled";
  }
}

export function getPositionLabel(pos: PlayerPosition): string {
  const labels: Record<PlayerPosition, string> = {
    setter: "Setter",
    outside_hitter: "Outside Hitter",
    middle_blocker: "Middle Blocker",
    opposite: "Opposite",
    libero: "Libero",
    defensive_specialist: "Def. Specialist",
  };
  return labels[pos] ?? pos;
}

export function getPositionShort(pos: PlayerPosition): string {
  const short: Record<PlayerPosition, string> = {
    setter: "S",
    outside_hitter: "OH",
    middle_blocker: "MB",
    opposite: "OPP",
    libero: "L",
    defensive_specialist: "DS",
  };
  return short[pos] ?? pos;
}

export function getCategoryLabel(cat: NewsCategory): string {
  const labels: Record<NewsCategory, string> = {
    match_report: "Match Report",
    announcement: "Announcement",
    transfer: "Transfer",
    national_team: "National Team",
    general: "General",
  };
  return labels[cat] ?? cat;
}

export function getSetResult(home: number, away: number): string {
  if (home > away) return "W";
  if (home < away) return "L";
  return "-";
}

export function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function formatScore(home: number, away: number): string {
  return `${home} – ${away}`;
}

export function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="20%"/>
          <stop stop-color="#edeef1" offset="50%"/>
          <stop stop-color="#f6f7f8" offset="70%"/>
        </linearGradient>
        <animate attributeName="x1" values="-2;1" dur="1s" repeatCount="indefinite"/>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>`;
}

export function toBase64(str: string): string {
  return typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);
}
