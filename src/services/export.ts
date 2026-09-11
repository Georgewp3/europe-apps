import type { AppData, DeadlineEntry, Program, University } from "@/types";
import { collectDeadlines } from "@/utils/deadlines";
import { checklistProgress, estimatedTotalCost, overallScore } from "@/utils/scoring";

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(data: AppData) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(
    JSON.stringify(data, null, 2),
    `ai-masters-tracker-backup-${stamp}.json`,
    "application/json",
  );
}

/* ------------------------------------------------------------------- CSV */

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(","));
  return lines.join("\n");
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  downloadBlob(toCsv(rows), filename, "text/csv;charset=utf-8");
}

export function programsToRows(programs: Program[], universities: University[]) {
  const byId = new Map(universities.map((u) => [u.id, u]));
  return programs.map((p) => {
    const u = byId.get(p.universityId);
    return {
      University: u?.name ?? "",
      Country: u?.country ?? "",
      City: u?.city ?? "",
      Programme: p.name,
      Field: p.field,
      Specialisation: p.specialisation,
      Priority: p.priority,
      "Admission estimate": p.admissionEstimate,
      Status: p.status,
      Opens: p.applicationOpenDate ?? "",
      Deadline: p.applicationDeadline ?? "",
      Start: p.startDate ?? p.startLabel,
      Language: p.language,
      "Duration (months)": p.durationMonths,
      ECTS: p.ects,
      Currency: p.finance.currency,
      "Annual tuition": p.finance.annualTuition,
      "Application fee": p.finance.applicationFee,
      "Estimated total cost (EUR)": estimatedTotalCost(p),
      "Checklist %": checklistProgress(p),
      "Overall score": overallScore(p.scores)?.toFixed(1) ?? "",
      URL: p.programUrl,
      "Last verified": p.lastVerified.slice(0, 10),
    };
  });
}

export function universitiesToRows(universities: University[], programs: Program[]) {
  return universities.map((u) => ({
    University: u.name,
    Country: u.country,
    City: u.city,
    Type: u.institutionLabel,
    Website: u.website,
    Programmes: programs.filter((p) => p.universityId === u.id).length,
    Notes: u.notes,
  }));
}

export function deadlinesToRows(entries: DeadlineEntry[]) {
  return entries.map((d) => ({
    Date: d.date.slice(0, 10),
    Type: d.type,
    University: d.universityName,
    Programme: d.programName,
    Country: d.country,
    Status: d.status,
  }));
}

/* ------------------------------------------------------------------- ICS */

function icsDate(value: string): string {
  return value.slice(0, 10).replace(/-/g, "");
}

function icsEscape(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function icsEvent(entry: DeadlineEntry): string[] {
  const start = icsDate(entry.date);
  const end = icsDate(
    new Date(new Date(entry.date).getTime() + 86400000).toISOString().slice(0, 10),
  );
  return [
    "BEGIN:VEVENT",
    `UID:${entry.id.replace(/[^a-zA-Z0-9:_-]/g, "")}@ai-masters-tracker`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(`${entry.type}: ${entry.programName} — ${entry.universityName}`)}`,
    `DESCRIPTION:${icsEscape(`${entry.country} · Application status: ${entry.status}`)}`,
    "END:VEVENT",
  ];
}

export function buildIcs(entries: DeadlineEntry[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Masters Application Tracker//EN",
    "CALSCALE:GREGORIAN",
    ...entries.flatMap(icsEvent),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function exportIcs(entries: DeadlineEntry[], filename: string) {
  downloadBlob(buildIcs(entries), filename, "text/calendar;charset=utf-8");
}

export function exportAllDeadlines(programs: Program[], universities: University[]) {
  exportIcs(collectDeadlines(programs, universities), "ai-masters-deadlines.ics");
}
