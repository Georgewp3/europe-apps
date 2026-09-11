import type { DeadlineEntry, Program, University } from "@/types";
import { daysUntil } from "./dates";

export type ProgramState = "OPEN NOW" | "OPENS LATER" | "DEADLINE SOON" | "CLOSED" | "NO DATES";

export function programState(program: Program): ProgramState {
  const toOpen = daysUntil(program.applicationOpenDate);
  const toDeadline = daysUntil(program.applicationDeadline);

  if (toDeadline !== null && toDeadline < 0) return "CLOSED";
  if (toDeadline !== null && toDeadline <= 14) return "DEADLINE SOON";
  if (toOpen !== null && toOpen > 0) return "OPENS LATER";
  if (toDeadline !== null && (toOpen === null || toOpen <= 0)) return "OPEN NOW";
  if (toOpen !== null && toOpen <= 0) return "OPEN NOW";
  return "NO DATES";
}

export type UrgencyBucket = "critical" | "urgent" | "soon" | "later" | "passed";

export function urgencyBucket(days: number | null): UrgencyBucket {
  if (days === null) return "later";
  if (days < 0) return "passed";
  if (days <= 7) return "critical";
  if (days <= 14) return "urgent";
  if (days <= 30) return "soon";
  return "later";
}

export const URGENCY_LABEL: Record<UrgencyBucket, string> = {
  critical: "0–7 days",
  urgent: "8–14 days",
  soon: "15–30 days",
  later: "30+ days",
  passed: "Closed",
};

export function collectDeadlines(
  programs: Program[],
  universities: University[],
): DeadlineEntry[] {
  const uniById = new Map(universities.map((u) => [u.id, u]));
  const out: DeadlineEntry[] = [];

  for (const p of programs) {
    const u = uniById.get(p.universityId);
    const base = {
      programId: p.id,
      programName: p.name,
      universityId: p.universityId,
      universityName: u?.name ?? "Unknown university",
      countryCode: u?.countryCode ?? "",
      country: u?.country ?? "",
      status: p.status,
    };
    const push = (type: DeadlineEntry["type"], date?: string | null, suffix = "") => {
      if (!date) return;
      out.push({ id: `${p.id}:${type}${suffix}`, type, date, ...base });
    };

    push("Application opening", p.applicationOpenDate);
    push("Application deadline", p.applicationDeadline);
    push("Application deadline", p.secondDeadline, ":2");
    push("Programme start", p.startDate);
    push("Decision date", p.offer.offerDate);
    push("Enrolment deadline", p.offer.acceptanceDeadline);

    for (const item of p.checklist) {
      if (item.dueDate) {
        out.push({
          id: `${p.id}:doc:${item.id}`,
          type: "Document deadline",
          date: item.dueDate,
          ...base,
        });
      }
    }
    for (const ev of p.timeline) {
      if (ev.date && /interview/i.test(ev.label) && !ev.done) {
        out.push({ id: `${p.id}:iv:${ev.id}`, type: "Interview", date: ev.date, ...base });
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const DEADLINE_TYPE_COLOR: Record<string, string> = {
  "Application opening": "bg-info-soft text-info border-info/25",
  "Application deadline": "bg-danger-soft text-danger border-danger/25",
  "Scholarship deadline": "bg-warning-soft text-warning border-warning/25",
  "Document deadline": "bg-neutralsoft text-muted-foreground border-border",
  "Programme start": "bg-success-soft text-success border-success/25",
  Interview: "bg-warning-soft text-warning border-warning/25",
  "Decision date": "bg-info-soft text-info border-info/25",
  "Enrolment deadline": "bg-success-soft text-success border-success/25",
};
