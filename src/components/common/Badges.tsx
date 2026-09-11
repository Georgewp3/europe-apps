import { cn } from "@/lib/utils";
import type { AdmissionEstimate, ApplicationStatus, Priority } from "@/types";
import type { ProgramState } from "@/utils/deadlines";

const base =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const PRIORITY_STYLES: Record<Priority, string> = {
  "Must Apply": "bg-danger-soft text-danger border-danger/30",
  High: "bg-warning-soft text-warning border-warning/30",
  Medium: "bg-info-soft text-info border-info/30",
  Low: "bg-neutralsoft text-muted-foreground border-border",
  Backup: "bg-neutralsoft text-muted-foreground border-border",
};

export function PriorityBadge({ value, className }: { value: Priority; className?: string }) {
  return <span className={cn(base, PRIORITY_STYLES[value], className)}>{value}</span>;
}

const ESTIMATE_STYLES: Record<AdmissionEstimate, string> = {
  "Very Strong": "bg-success-soft text-success border-success/30",
  "Strong Target": "bg-success-soft text-success border-success/30",
  Target: "bg-info-soft text-info border-info/30",
  Competitive: "bg-warning-soft text-warning border-warning/30",
  Reach: "bg-danger-soft text-danger border-danger/30",
  "Very Difficult": "bg-danger-soft text-danger border-danger/40",
};

export function EstimateBadge({
  value,
  className,
}: {
  value: AdmissionEstimate;
  className?: string;
}) {
  return <span className={cn(base, ESTIMATE_STYLES[value], className)}>{value}</span>;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Researching: "bg-neutralsoft text-muted-foreground border-border",
  Shortlisted: "bg-neutralsoft text-foreground border-border",
  Preparing: "bg-info-soft text-info border-info/30",
  "Ready to Apply": "bg-info-soft text-info border-info/40",
  Submitted: "bg-success-soft text-success border-success/30",
  "Under Review": "bg-warning-soft text-warning border-warning/30",
  Interview: "bg-warning-soft text-warning border-warning/40",
  Offer: "bg-success-soft text-success border-success/40",
  Accepted: "bg-success-soft text-success border-success/50",
  Waitlisted: "bg-warning-soft text-warning border-warning/30",
  Rejected: "bg-danger-soft text-danger border-danger/30",
  Withdrawn: "bg-neutralsoft text-muted-foreground border-border",
};

export function StatusBadge({
  value,
  className,
}: {
  value: ApplicationStatus;
  className?: string;
}) {
  return <span className={cn(base, STATUS_STYLES[value], className)}>{value}</span>;
}

const STATE_STYLES: Record<ProgramState, string> = {
  "OPEN NOW": "bg-success-soft text-success border-success/30",
  "DEADLINE SOON": "bg-danger-soft text-danger border-danger/40",
  "OPENS LATER": "bg-info-soft text-info border-info/30",
  CLOSED: "bg-neutralsoft text-muted-foreground border-border",
  "NO DATES": "bg-neutralsoft text-muted-foreground border-border",
};

export function StateBadge({ value, className }: { value: ProgramState; className?: string }) {
  return (
    <span className={cn(base, "uppercase tracking-wide", STATE_STYLES[value], className)}>
      {value === "NO DATES" ? "Dates TBC" : value}
    </span>
  );
}
