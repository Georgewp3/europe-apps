import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy") : fallback;
}

export function formatDateShort(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yy") : fallback;
}

export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Positive = in the future, negative = in the past. Null when there is no date. */
export function daysUntil(value?: string | null): number | null {
  const d = toDate(value);
  if (!d) return null;
  return differenceInCalendarDays(d, todayStart());
}

export function daysSince(value?: string | null): number | null {
  const days = daysUntil(value);
  return days === null ? null : -days;
}

export function toInputDate(value?: string | null): string {
  const d = toDate(value);
  return d ? format(d, "yyyy-MM-dd") : "";
}

export function relativeDays(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 0) return `${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}
